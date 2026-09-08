// Admin v2 server-side gateway.
export async function handleAdminV2(url, request, env, ctx, helpers) {
  const { requireAdmin, jsonResponse, createTursoDB, corsHeaders, bumpDataVersion } = helpers;
  if (!url.pathname.startsWith('/api/admin-v2')) return null;

  const auth = await requireAdmin(request, env);
  if (auth.response) return auth.response;
  const db = createTursoDB(env);
  const q = String(url.searchParams.get('q') || '').trim();
  const type = String(url.searchParams.get('type') || '').trim();
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') || 50)));
  const offset = Math.max(0, Number(url.searchParams.get('offset') || 0));
  const one = (sql,args=[]) => db.prepare(sql).bind(...args).first();
  const all = async (sql,args=[]) => (await db.prepare(sql).bind(...args).all()).results || [];
  const count = r => Number(r?.c || 0);
  const escLike = v => `%${v}%`;

  if (url.pathname === '/api/admin-v2/snapshot' && request.method === 'GET') {
    const queries = {
      places:'SELECT COUNT(*) c FROM places', users:'SELECT COUNT(*) c FROM users', reviews:'SELECT COUNT(*) c FROM reviews',
      verifiedPlaces:'SELECT COUNT(*) c FROM places WHERE is_verified=1', products:'SELECT COUNT(*) c FROM products', offers:'SELECT COUNT(*) c FROM offers',
      ads:'SELECT COUNT(*) c FROM ads', pendingVerification:"SELECT COUNT(*) c FROM verification_requests WHERE status='pending'",
      pendingCategory:"SELECT COUNT(*) c FROM category_requests WHERE status='pending'", placeReports:"SELECT COUNT(*) c FROM place_reports WHERE COALESCE(status,'pending') NOT IN ('resolved','closed')",
      liveNews:"SELECT COUNT(*) c FROM live_news WHERE status='published'", fcmTokens:'SELECT COUNT(*) c FROM fcm_tokens'
    };
    const stats={}, errors=[];
    await Promise.all(Object.entries(queries).map(async ([k,sql])=>{try{stats[k]=count(await one(sql))}catch(e){stats[k]=null;errors.push(`${k}: ${e.message}`)}}));
    let turso=false; try{await db.prepare('SELECT 1').all();turso=true}catch(e){errors.push('turso: '+e.message)}
    const recent=await all("SELECT 'place' entity,id entity_id,'updated' action,updated_at at FROM places ORDER BY updated_at DESC LIMIT 8");
    return jsonResponse({success:true,stats,health:{turso,r2:!!env.elmanzala,firebase:true},recent,errors,generatedAt:Date.now()},200,{...corsHeaders,'Cache-Control':'no-store'});
  }

  const map={
    places:{from:'places p LEFT JOIN users u ON u.id=p.owner_id',select:'p.*,u.name owner_name,u.email owner_email_user',where:'p.name LIKE ? OR p.phone LIKE ? OR p.whatsapp LIKE ? OR p.area LIKE ? OR p.address LIKE ?',count:'SELECT COUNT(*) c FROM places p'},
    users:{from:'users u LEFT JOIN places p ON p.owner_id=u.id',select:'u.*,COUNT(p.id) places_count',where:'u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?',count:'SELECT COUNT(*) c FROM users u',group:' GROUP BY u.id'},
    verification:{from:'verification_requests',select:'*',where:'place_name LIKE ? OR owner_name LIKE ? OR owner_email LIKE ?',count:'SELECT COUNT(*) c FROM verification_requests'},
    categories:{from:'category_requests',select:'*',where:'category_name LIKE ? OR place_name LIKE ? OR owner_name LIKE ?',count:'SELECT COUNT(*) c FROM category_requests'},
    reviews:{from:'reviews',select:'*',where:'comment LIKE ? OR place_name LIKE ? OR user_name LIKE ?',count:'SELECT COUNT(*) c FROM reviews'},
    products:{from:'products',select:'*',where:'name LIKE ? OR place_name LIKE ? OR place_id LIKE ?',count:'SELECT COUNT(*) c FROM products'},
    offers:{from:'offers',select:'*',where:'title LIKE ? OR place_name LIKE ? OR place_id LIKE ?',count:'SELECT COUNT(*) c FROM offers'},
    ads:{from:'ads',select:'*',where:'title LIKE ? OR name LIKE ?',count:'SELECT COUNT(*) c FROM ads'},
    'live-news':{from:'live_news',select:'*',where:'title LIKE ? OR location LIKE ? OR city LIKE ?',count:'SELECT COUNT(*) c FROM live_news'},
    reports:{from:'place_reports pr LEFT JOIN places p ON p.id=pr.place_id',select:'pr.*,p.name place_name',where:'p.name LIKE ? OR pr.reason LIKE ? OR pr.reporter_name LIKE ?',count:'SELECT COUNT(*) c FROM place_reports'},
    settings:{from:'app_settings',select:'key,value_json,updated_at',where:'key LIKE ?',count:'SELECT COUNT(*) c FROM app_settings'}
  };
  const cfg=map[type];

  if(url.pathname==='/api/admin-v2/list' && request.method==='GET'){
    if(!cfg)return jsonResponse({success:false,error:'نوع قائمة غير معروف'},400,corsHeaders);
    let where='',args=[]; if(q){where=' WHERE '+cfg.where; args=Array((cfg.where.match(/\?/g)||[]).length).fill(escLike(q));}
    const total=count(await one(cfg.count+where,args));
    const order=type==='settings'?'updated_at':(type==='users'?'u.created_at':(type==='places'?'p.created_at':'created_at'));
    const sql=`SELECT ${cfg.select} FROM ${cfg.from}${where}${cfg.group||''} ORDER BY ${order} DESC LIMIT ? OFFSET ?`;
    const data=await all(sql,[...args,limit,offset]);
    return jsonResponse({success:true,data,total,limit,offset},200,{...corsHeaders,'Cache-Control':'no-store'});
  }

  if(url.pathname==='/api/admin-v2/item' && request.method==='GET'){
    if(!cfg)return jsonResponse({success:false,error:'نوع غير معروف'},400,corsHeaders);
    const id=String(url.searchParams.get('id')||'').trim(); if(!id)return jsonResponse({success:false,error:'id مطلوب'},400,corsHeaders);
    const key=type==='settings'?'key':'id'; const prefix=type==='reports'?'pr.':type==='places'?'p.':type==='users'?'u.':'';
    const row=await one(`SELECT ${cfg.select} FROM ${cfg.from} WHERE ${prefix}${key}=? LIMIT 1`,[id]);
    return row?jsonResponse({success:true,data:row},200,corsHeaders):jsonResponse({success:false,error:'العنصر غير موجود'},404,corsHeaders);
  }

  if(url.pathname==='/api/admin-v2/action' && request.method==='POST'){
    const id=String(url.searchParams.get('id')||'').trim(); const body=await request.json().catch(()=>({})); const status=String(body.status||'').trim(); const now=Date.now();
    if(!id)return jsonResponse({success:false,error:'id مطلوب'},400,corsHeaders);
    if(type==='verification'){await db.prepare('UPDATE verification_requests SET status=?,reviewed_at=? WHERE id=?').bind(status,now,id).run(); if(status==='approved'){const r=await one('SELECT place_id FROM verification_requests WHERE id=?',[id]); if(r?.place_id) await db.prepare("UPDATE places SET is_verified=1,verification_status='verified',updated_at=? WHERE id=?").bind(now,r.place_id).run();}}
    else if(type==='categories') await db.prepare('UPDATE category_requests SET status=?,reviewed_at=? WHERE id=?').bind(status,now,id).run();
    else if(type==='products') await db.prepare('UPDATE products SET status=?,is_approved=?,rejection_reason=?,updated_at=? WHERE id=?').bind(status,status==='approved'?1:0,status==='rejected'?(body.reason||'مرفوض من الإدارة'):null,now,id).run();
    else if(type==='live-news') await db.prepare('UPDATE live_news SET status=?,published_at=?,updated_at=? WHERE id=?').bind(status,status==='published'?now:null,now,id).run();
    else if(type==='reports') await db.prepare('UPDATE place_reports SET status=?,reviewed_at=? WHERE id=?').bind(status,now,id).run();
    else return jsonResponse({success:false,error:'الإجراء غير مدعوم'},400,corsHeaders);
    bumpDataVersion(env,ctx); return jsonResponse({success:true},200,{...corsHeaders,'Cache-Control':'no-store'});
  }

  if(url.pathname==='/api/admin-v2/mutate' && request.method==='POST'){
    const body=await request.json().catch(()=>({})); const id=String(url.searchParams.get('id')||body.id||'').trim(); const now=Date.now();
    if(type==='places'){
      const pid=id||`place_${now}_${crypto.randomUUID().slice(0,6)}`;
      await db.prepare(`INSERT INTO places (id,name,name_en,slug,category_id,custom_category,address,area,phone,whatsapp,maps_link,latitude,longitude,description,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,name_en=excluded.name_en,slug=excluded.slug,category_id=excluded.category_id,custom_category=excluded.custom_category,address=excluded.address,area=excluded.area,phone=excluded.phone,whatsapp=excluded.whatsapp,maps_link=excluded.maps_link,latitude=excluded.latitude,longitude=excluded.longitude,description=excluded.description,status=excluded.status,updated_at=excluded.updated_at`).bind(pid,body.name||'',body.name_en||'',body.slug||pid,body.category_id||'general',body.custom_category||'',body.address||'',body.area||'',body.phone||'',body.whatsapp||'',body.maps_link||'',body.latitude??null,body.longitude??null,body.description||'',body.status||'published',body.created_at||now,now).run();
      bumpDataVersion(env,ctx); return jsonResponse({success:true,id:pid},200,corsHeaders);
    }
    if(type==='users'){await db.prepare('UPDATE users SET name=?,email=?,phone=?,role=?,status=?,points=?,updated_at=? WHERE id=?').bind(body.name||'',body.email||'',body.phone||'',body.role||'user',body.status||'active',Number(body.points||0),now,id).run();return jsonResponse({success:true},200,corsHeaders);}
    if(type==='reviews'){await db.prepare('UPDATE reviews SET rating=?,comment=?,updated_at=? WHERE id=?').bind(Number(body.rating||5),body.comment||'',now,id).run();bumpDataVersion(env,ctx);return jsonResponse({success:true},200,corsHeaders);}
    if(type==='offers'){
      const oid=id||`offer_${now}_${crypto.randomUUID().slice(0,6)}`;
      await db.prepare(`INSERT INTO offers (id,place_id,title,description,old_price,new_price,discount_percent,start_date,end_date,status,owner_id,views,clicks,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET title=excluded.title,description=excluded.description,old_price=excluded.old_price,new_price=excluded.new_price,discount_percent=excluded.discount_percent,start_date=excluded.start_date,end_date=excluded.end_date,status=excluded.status,updated_at=excluded.updated_at`).bind(oid,body.place_id||body.placeId||'',body.title||'',body.description||'',Number(body.old_price||0),Number(body.new_price||0),Number(body.discount_percent||0),body.start_date||now,body.end_date||now,body.status||'active',body.owner_id||auth.user.uid,Number(body.views||0),Number(body.clicks||0,0),body.created_at||now,now).run(); bumpDataVersion(env,ctx); return jsonResponse({success:true,id:oid},200,corsHeaders);
    }
    if(type==='ads'){const aid=id||`ad_${now}_${crypto.randomUUID().slice(0,6)}`; await db.prepare(`INSERT INTO ads (id,title,link_url,image_url,status,priority,views,clicks,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET title=excluded.title,link_url=excluded.link_url,image_url=excluded.image_url,status=excluded.status,priority=excluded.priority,updated_at=excluded.updated_at`).bind(aid,body.title||'',body.link_url||'',body.image_url||'',body.status||'active',Number(body.priority||0),Number(body.views||0),Number(body.clicks||0),body.created_at||now,now).run(); bumpDataVersion(env,ctx); return jsonResponse({success:true,id:aid},200,corsHeaders);}
    if(type==='settings'){await db.prepare('INSERT INTO app_settings(key,value_json,updated_at) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET value_json=excluded.value_json,updated_at=excluded.updated_at').bind(body.key,JSON.stringify(body.value),now).run();return jsonResponse({success:true},200,corsHeaders);}
    return jsonResponse({success:false,error:'نوع تعديل غير مدعوم'},400,corsHeaders);
  }

  if(url.pathname==='/api/admin-v2/mutate' && request.method==='DELETE'){
    const id=String(url.searchParams.get('id')||'').trim(); const tables={places:'places',reviews:'reviews',offers:'offers',ads:'ads','live-news':'live_news'}; const table=tables[type];
    if(!id||!table)return jsonResponse({success:false,error:'الحذف غير مدعوم'},400,corsHeaders);
    await db.prepare(`DELETE FROM ${table} WHERE id=?`).bind(id).run(); bumpDataVersion(env,ctx); return jsonResponse({success:true},200,corsHeaders);
  }
  return jsonResponse({success:false,error:'Admin v2 route not found'},404,corsHeaders);
}
