import { initFirebase } from '../src/js/core/firebase.js';
import { initAuth, waitForAuth, isAdmin, getIdToken, signOut } from '../src/js/core/auth.js';

const WORKER_URL = 'https://elmanzala.nonm1724.workers.dev';
const state = { section: new URLSearchParams(location.search).get('section') || 'overview', query:'', page:0, limit:50, lastSnapshot:null, poll:null };
const $ = s => document.querySelector(s);
const esc = v => String(v ?? '').replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
const n = v => Number(v || 0).toLocaleString('ar-EG');
function fmt(ts){ if(!ts) return '—'; try{return new Intl.DateTimeFormat('ar-EG',{dateStyle:'medium',timeStyle:'short'}).format(new Date(Number(ts)))}catch{return String(ts)} }
function badge(status){ const s=String(status||'').toLowerCase(); const cls=['approved','published','active','verified'].includes(s)?'good':['pending','verification_requested'].includes(s)?'warn':['rejected','banned','suspended','disabled'].includes(s)?'bad':''; return `<span class="badge ${cls}">${esc(status||'—')}</span>` }

async function api(path, options={}) {
  const token = await getIdToken();
  const headers = {'Content-Type':'application/json', ...(token?{Authorization:`Bearer ${token}`}:{})};
  const res = await fetch(WORKER_URL + path, {...options, headers:{...headers,...(options.headers||{})}, cache:'no-store'});
  const data = await res.json().catch(()=>({success:false,error:'استجابة غير صالحة'}));
  if(!res.ok || data.success===false){ const e=new Error(data.error||data.message||`HTTP ${res.status}`); e.status=res.status; throw e; }
  return data;
}

async function loadSnapshot(){ return api('/api/admin-v2/snapshot'); }
async function loadList(type){
  const q=new URLSearchParams({type,limit:String(state.limit),offset:String(state.page*state.limit)});
  if(state.query) q.set('q',state.query);
  return api('/api/admin-v2/list?'+q.toString());
}
async function mutate(path, method, body){ return api(path,{method,body:JSON.stringify(body||{})}); }

function layout(){
  $('#root').innerHTML=`<div class="app">
    <aside class="sidebar"><div class="brand"><h1>لوحة الإدارة Pro</h1><p>دليل المنزلة والمطرية الرقمي · Admin v2</p></div>
      <div class="status" id="connection"><i class="dot"></i><span>جاري التحقق من الاتصال…</span></div>
      <nav class="nav" id="nav">
        <small>الإدارة</small>
        ${[['overview','📊','الرئيسية'],['places','📍','الأماكن'],['users','👥','المستخدمون'],['verification','🛡️','طلبات التوثيق'],['categories','🗂️','طلبات التصنيف'],['reviews','⭐','التقييمات'],['products','🛍️','المنتجات'],['offers','🏷️','العروض'],['ads','📣','الإعلانات'],['live-news','⚡','يحدث الآن'],['reports','🚩','البلاغات'],['settings','⚙️','الإعدادات']].map(([k,i,l])=>`<button data-sec="${k}">${i} ${l}</button>`).join('')}
        <small>النظام</small><button id="refresh">🔄 تحديث شامل</button><button id="logout">🚪 تسجيل الخروج</button>
      </nav></aside>
    <main class="main"><div class="top"><div><h2 id="title">لوحة الإدارة</h2><div class="muted" id="subtitle">مصدر البيانات: Turso عبر Worker · الملفات: R2 · الهوية والإشعارات: Firebase</div></div><div class="tools"><button class="btn" id="force">إعادة تحميل من الخادم</button><button class="btn primary" id="add">+ إضافة</button></div></div><div id="view"></div></main>
  </div>`;
  $('#nav').addEventListener('click',e=>{const b=e.target.closest('[data-sec]'); if(b) go(b.dataset.sec)});
  $('#refresh').onclick=()=>render(); $('#force').onclick=()=>render(true); $('#logout').onclick=async()=>{await signOut();location.href='../login.html?redirect=admin-v2/'}; $('#add').onclick=()=>addNew();
}
function go(sec){ state.section=sec; state.page=0; state.query=''; history.replaceState({},'',`?section=${encodeURIComponent(sec)}`); render(); }
function selectNav(){ document.querySelectorAll('[data-sec]').forEach(b=>b.classList.toggle('active',b.dataset.sec===state.section)); }
function setTitle(){ const map={overview:'الرئيسية والإحصائيات',places:'إدارة الأماكن',users:'المستخدمون والصلاحيات',verification:'طلبات التوثيق',categories:'طلبات التصنيفات',reviews:'إدارة التقييمات',products:'المنتجات',offers:'العروض',ads:'الإعلانات والترويج','live-news':'يحدث الآن',reports:'البلاغات',settings:'إعدادات المنصة'}; $('#title').textContent=map[state.section]||'لوحة الإدارة'; }
function qbar(placeholder){ return `<div class="toolbar"><input id="search" placeholder="${esc(placeholder||'بحث…')}" value="${esc(state.query)}"><button class="btn" id="searchBtn">بحث</button><button class="btn" id="clearBtn">مسح</button></div>`; }
function table(headers, rows){ if(!rows.length)return `<div class="empty">لا توجد بيانات مطابقة.</div>`; return `<div class="table-wrap"><table class="table"><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`; }
function pager(total){ const max=Math.max(0,Math.ceil(total/state.limit)-1); return `<div class="pagination"><button class="btn" data-page="prev" ${state.page<=0?'disabled':''}>السابق</button><span>صفحة ${state.page+1} من ${max+1}</span><button class="btn" data-page="next" ${state.page>=max?'disabled':''}>التالي</button></div>`; }

async function render(force=false){
  setTitle(); selectNav(); const v=$('#view'); v.innerHTML='<div class="loading">جاري تحميل البيانات الموثوقة من الخادم…</div>';
  try{
    if(force || !state.lastSnapshot || state.section==='overview'){
      state.lastSnapshot=await loadSnapshot();
    }
    if(state.section==='overview') return renderOverview(state.lastSnapshot);
    const d=await loadList(state.section); return renderList(state.section,d);
  }catch(e){ v.innerHTML=`<div class="error"><strong>تعذر تحميل هذه الصفحة.</strong><br>${esc(e.message)}<br><small>لن يتم عرض «0» عند فشل المصدر؛ ستظهر حالة الخطأ صراحة.</small></div>`; setConn(false,e.message); }
}
function setConn(ok,msg=''){ const el=$('#connection'); if(!el)return; el.innerHTML=`<i class="dot ${ok?'good':'bad'}"></i><span>${ok?'الخادم متصل ومتزامن':'انقطاع/خطأ: '+esc(msg)}</span>`; }
function renderOverview(d){
  setConn(true); const s=d?.stats||{}; const cards=[['الأماكن',s.places,'📍'],['المستخدمون',s.users,'👥'],['الموثقون',s.verifiedPlaces,'🛡️'],['التقييمات',s.reviews,'⭐'],['المنتجات',s.products,'🛍️'],['العروض',s.offers,'🏷️'],['الإعلانات',s.ads,'📣'],['طلبات التوثيق',s.pendingVerification,'⏳'],['طلبات التصنيف',s.pendingCategory,'🗂️'],['البلاغات',s.placeReports,'🚩'],['يحدث الآن',s.liveNews,'⚡'],['Tokens FCM',s.fcmTokens,'🔔']];
  $('#view').innerHTML=`<div class="grid">${cards.map(c=>`<div class="card metric"><div class="label">${c[2]} ${c[0]}</div><div class="value">${n(c[1])}</div></div>`).join('')}<div class="card wide"><div class="section"><h3>حالة المكونات</h3><div class="grid">${Object.entries(d?.health||{}).map(([k,v])=>`<div class="card"><div class="label">${esc(k)}</div><div style="margin-top:8px">${v?'<span class="badge good">OK</span>':'<span class="badge bad">ERROR</span>'}</div></div>`).join('')}</div></div></div>
  <div class="card wide"><div class="section"><h3>آخر العمليات</h3>${table(['العملية','الكيان','المعرف','الوقت'],(d?.recent||[]).map(x=>`<tr><td>${esc(x.action)}</td><td>${esc(x.entity)}</td><td>${esc(x.entityId)}</td><td>${fmt(x.at)}</td></tr>`))}</div></div></div>`;
}
function renderList(type,d){
 const data=Array.isArray(d?.data)?d.data:[]; const total=Number(d?.total??data.length); const v=$('#view');
 const configs={
  places:{search:'ابحث بالاسم أو الهاتف أو المنطقة',add:'إضافة مكان',headers:['المكان','الحالة','التوثيق','المالك','آخر تحديث','إجراءات'],row:x=>`<tr><td><strong>${esc(x.name)}</strong><br><span class="muted">${esc(x.area||x.address||'')}</span></td><td>${badge(x.status)}</td><td>${x.is_verified?'<span class="badge good">موثق</span>':'<span class="badge">غير موثق</span>'}</td><td>${esc(x.owner_name||x.owner_email||'—')}</td><td>${fmt(x.updated_at)}</td><td><button class="btn" data-edit="places" data-id="${esc(x.id)}">تعديل</button> <button class="btn bad" data-del="places" data-id="${esc(x.id)}">حذف</button></td></tr>`},
  users:{search:'ابحث بالاسم أو البريد أو الهاتف',headers:['المستخدم','الدور','الحالة','الأماكن','النقاط','تاريخ التسجيل','إجراءات'],row:x=>`<tr><td><strong>${esc(x.name)}</strong><br>${esc(x.email||'')}</td><td>${badge(x.role)}</td><td>${badge(x.status)}</td><td>${n(x.places_count)}</td><td>${n(x.points)}</td><td>${fmt(x.created_at)}</td><td><button class="btn" data-edit="users" data-id="${esc(x.id)}">إدارة</button></td></tr>`},
  verification:{search:'ابحث باسم المكان أو المالك',headers:['المكان','المالك','الهاتف','الحالة','التاريخ','إجراءات'],row:x=>`<tr><td><strong>${esc(x.place_name)}</strong></td><td>${esc(x.owner_name||x.owner_email)}</td><td>${esc(x.phone||'—')}</td><td>${badge(x.status)}</td><td>${fmt(x.created_at)}</td><td><button class="btn good" data-action="verify-approve" data-id="${esc(x.id)}">قبول</button> <button class="btn bad" data-action="verify-reject" data-id="${esc(x.id)}">رفض</button></td></tr>`},
  categories:{search:'ابحث باسم التصنيف أو المكان',headers:['التصنيف','المكان','مقدم الطلب','الحالة','التاريخ','إجراءات'],row:x=>`<tr><td>${esc(x.category_name)}</td><td>${esc(x.place_name||'—')}</td><td>${esc(x.owner_name||'—')}</td><td>${badge(x.status)}</td><td>${fmt(x.created_at)}</td><td><button class="btn good" data-action="category-approve" data-id="${esc(x.id)}">قبول</button> <button class="btn bad" data-action="category-reject" data-id="${esc(x.id)}">رفض</button></td></tr>`},
  reviews:{search:'ابحث بالتعليق أو اسم المكان أو المستخدم',headers:['المكان','المستخدم','التقييم','التعليق','التاريخ','إجراءات'],row:x=>`<tr><td>${esc(x.place_name||x.place_id)}</td><td>${esc(x.user_name||x.user_id)}</td><td>⭐ ${esc(x.rating)}</td><td>${esc(x.comment)}</td><td>${fmt(x.created_at)}</td><td><button class="btn" data-edit="reviews" data-id="${esc(x.id)}">تعديل</button> <button class="btn bad" data-del="reviews" data-id="${esc(x.id)}">حذف</button></td></tr>`},
  products:{search:'ابحث باسم المنتج أو المكان',headers:['المنتج','المكان','السعر','الحالة','الموافقة','التاريخ','إجراءات'],row:x=>`<tr><td>${esc(x.name)}</td><td>${esc(x.place_name||x.place_id)}</td><td>${n(x.price)}</td><td>${badge(x.status)}</td><td>${x.is_approved?'<span class="badge good">معتمد</span>':'<span class="badge warn">بانتظار</span>'}</td><td>${fmt(x.created_at)}</td><td><button class="btn good" data-action="product-approve" data-id="${esc(x.id)}">اعتماد</button> <button class="btn bad" data-action="product-reject" data-id="${esc(x.id)}">رفض</button></td></tr>`},
  offers:{search:'ابحث باسم العرض أو المكان',headers:['العرض','المكان','الجديد','الخصم','الحالة','التاريخ','إجراءات'],row:x=>`<tr><td>${esc(x.title)}</td><td>${esc(x.place_name||x.place_id)}</td><td>${n(x.new_price)}</td><td>${esc(x.discount_percent)}%</td><td>${badge(x.status)}</td><td>${fmt(x.created_at)}</td><td><button class="btn" data-edit="offers" data-id="${esc(x.id)}">تعديل</button> <button class="btn bad" data-del="offers" data-id="${esc(x.id)}">حذف</button></td></tr>`},
  ads:{search:'ابحث باسم الإعلان',headers:['الإعلان','الوجهة','الحالة','الأولوية','المشاهدات','النقرات','إجراءات'],row:x=>`<tr><td>${esc(x.title||x.name)}</td><td>${esc(x.link_url||x.target_url||'—')}</td><td>${badge(x.status)}</td><td>${n(x.priority)}</td><td>${n(x.views)}</td><td>${n(x.clicks)}</td><td><button class="btn" data-edit="ads" data-id="${esc(x.id)}">تعديل</button> <button class="btn bad" data-del="ads" data-id="${esc(x.id)}">حذف</button></td></tr>`},
  'live-news':{search:'ابحث في الأخبار والتحديثات',headers:['العنوان','الموقع','التصنيف','الحالة','التاريخ','إجراءات'],row:x=>`<tr><td>${esc(x.title)}</td><td>${esc(x.location||x.city||'—')}</td><td>${esc(x.category||'—')}</td><td>${badge(x.status)}</td><td>${fmt(x.created_at)}</td><td><button class="btn good" data-action="news-publish" data-id="${esc(x.id)}">نشر</button> <button class="btn bad" data-del="live-news" data-id="${esc(x.id)}">حذف</button></td></tr>`},
  reports:{search:'ابحث في البلاغات',headers:['المكان','السبب','المبلغ','التاريخ','الحالة','إجراءات'],row:x=>`<tr><td>${esc(x.place_name||x.place_id)}</td><td>${esc(x.reason)}</td><td>${esc(x.reporter_name||'زائر')}</td><td>${fmt(x.created_at)}</td><td>${badge(x.status||'pending')}</td><td><button class="btn good" data-action="report-resolve" data-id="${esc(x.id)}">معالجة</button></td></tr>`},
  settings:{search:'',headers:['المفتاح','القيمة','آخر تحديث','إجراءات'],row:x=>`<tr><td>${esc(x.key)}</td><td><pre style="white-space:pre-wrap;margin:0;color:#d7e6f2">${esc(JSON.stringify(x.value))}</pre></td><td>${fmt(x.updated_at)}</td><td><button class="btn" data-edit="settings" data-id="${esc(x.key)}">تعديل</button></td></tr>`}
 };
 const c=configs[type]||configs.places; v.innerHTML=`${qbar(c.search)}<div class="card">${table(c.headers,data.map(c.row))}${pager(total)}</div>`;
 $('#searchBtn')?.addEventListener('click',()=>{state.query=$('#search').value.trim();state.page=0;render()}); $('#clearBtn')?.addEventListener('click',()=>{state.query='';state.page=0;render()}); $('#search')?.addEventListener('keydown',e=>{if(e.key==='Enter')$('#searchBtn').click()});
 v.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>{if(b.dataset.page==='prev'&&state.page>0)state.page--; if(b.dataset.page==='next'&&data.length===state.limit)state.page++; render()});
 v.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>editItem(b.dataset.edit,b.dataset.id)); v.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>deleteItem(b.dataset.del,b.dataset.id)); v.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>actionItem(b.dataset.action,b.dataset.id));
}

async function addNew(){ const sec=state.section; if(sec==='places') return formPlace(); if(sec==='categories') return; if(sec==='offers') return formGeneric('offers'); if(sec==='ads') return formGeneric('ads'); if(sec==='reviews') return formGeneric('reviews'); }
async function editItem(type,id){ const d=await api(`/api/admin-v2/item?type=${encodeURIComponent(type)}&id=${encodeURIComponent(id)}`); formGeneric(type,d.data||{}); }
function closeModal(){$('#modal').classList.remove('show')}
function openModal(html){$('#modal-content').innerHTML=html;$('#modal').classList.add('show');$('#modal').onclick=e=>{if(e.target.id==='modal')closeModal()}}
function input(name,label,value='',type='text'){return `<div class="field"><label>${label}</label><input id="f_${name}" name="${name}" type="${type}" value="${esc(value)}"></div>`}
function formPlace(data={}){openModal(`<h3>مكان جديد</h3><div class="modal-grid">${input('name','اسم المكان',data.name)}${input('name_en','الاسم بالإنجليزية',data.name_en)}${input('phone','الهاتف',data.phone)}${input('whatsapp','واتساب',data.whatsapp)}${input('area','المنطقة',data.area||'المنزلة')}${input('address','العنوان',data.address)}${input('category_id','التصنيف',data.category_id)}${input('custom_category','تصنيف مخصص',data.custom_category)}${input('maps_link','رابط الخريطة',data.maps_link)}${input('latitude','خط العرض',data.latitude,'number')}${input('longitude','خط الطول',data.longitude,'number')}<div class="field full"><label>الوصف</label><textarea id="f_description" rows="4">${esc(data.description||'')}</textarea></div></div><div class="modal-actions"><button class="btn primary" id="save">حفظ ومزامنة Turso</button><button class="btn" id="cancel">إلغاء</button></div>`); $('#cancel').onclick=closeModal; $('#save').onclick=async()=>{ const b={id:data.id||undefined,name:$('#f_name').value,name_en:$('#f_name_en').value,phone:$('#f_phone').value,whatsapp:$('#f_whatsapp').value,area:$('#f_area').value,address:$('#f_address').value,category_id:$('#f_category_id').value,custom_category:$('#f_custom_category').value,maps_link:$('#f_maps_link').value,latitude:Number($('#f_latitude').value)||null,longitude:Number($('#f_longitude').value)||null,description:$('#f_description').value,status:'published'}; try{await mutate('/api/places/sync','POST',b);closeModal();state.lastSnapshot=null;render(true)}catch(e){alert(e.message)}} }
function formGeneric(type,data={}){ const maps={users:[['name','الاسم'],['email','البريد'],['phone','الهاتف'],['role','الدور'],['status','الحالة'],['points','النقاط','number']],offers:[['title','العنوان'],['description','الوصف'],['old_price','السعر القديم','number'],['new_price','السعر الجديد','number'],['discount_percent','الخصم %','number'],['start_date','بداية العرض','number'],['end_date','نهاية العرض','number'],['status','الحالة']],ads:[['title','العنوان'],['link_url','الرابط'],['image_url','الصورة'],['status','الحالة'],['priority','الأولوية','number']],reviews:[['rating','التقييم','number'],['comment','التعليق'],['user_name','اسم المستخدم'],['place_name','اسم المكان']],settings:[['key','المفتاح'],['value','القيمة']]}; const fields=maps[type]||[['name','الاسم']]; const keyFields=fields.map(([k,l,t='text'])=>t==='text'&&['description','comment','value'].includes(k)?`<div class="field full"><label>${l}</label><textarea id="f_${k}" rows="4">${esc(data[k]??'')}</textarea></div>`:input(k,l,data[k]??'',t)).join(''); openModal(`<h3>إدارة ${esc(type)}</h3><div class="modal-grid">${keyFields}</div><div class="modal-actions"><button class="btn primary" id="save">حفظ</button><button class="btn" id="cancel">إلغاء</button></div>`); $('#cancel').onclick=closeModal; $('#save').onclick=async()=>{const body={id:data.id,key:data.key};fields.forEach(([k])=>{const el=$(`#f_${k}`);if(el)body[k]=el.tagName==='TEXTAREA'?el.value:el.value}); try{await api(`/api/admin-v2/mutate?type=${encodeURIComponent(type)}${data.id?`&id=${encodeURIComponent(data.id)}`:''}`,{method:'POST',body:JSON.stringify(body)});closeModal();render(true)}catch(e){alert(e.message)}}; }
async function deleteItem(type,id){if(!confirm('تأكيد الحذف؟'))return; try{await api(`/api/admin-v2/mutate?type=${encodeURIComponent(type)}&id=${encodeURIComponent(id)}`,{method:'DELETE'});render(true)}catch(e){alert(e.message)}}
async function actionItem(action,id){try{const map={'verify-approve':['verification','approved'],'verify-reject':['verification','rejected'],'category-approve':['categories','approved'],'category-reject':['categories','rejected'],'product-approve':['products','approved'],'product-reject':['products','rejected'],'news-publish':['live-news','published'],'report-resolve':['reports','resolved']};const [type,status]=map[action]||[];if(!type)return;await mutate(`/api/admin-v2/action?type=${type}&id=${encodeURIComponent(id)}`,'POST',{status});render(true)}catch(e){alert(e.message)}}

(async()=>{try{initFirebase();initAuth();const u=await waitForAuth();if(!u){location.href='../login.html?redirect=admin-v2/';return}if(!isAdmin(u)){document.body.innerHTML='<div style="padding:40px;text-align:center;font-family:system-ui">غير مصرح بالدخول إلى لوحة الإدارة.</div>';return}layout();await render(true);state.poll=setInterval(()=>{ if(!document.hidden && state.section==='overview') render(true)},30000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)render(true)})}catch(e){document.body.innerHTML=`<div style="padding:40px;font-family:system-ui"><h2>تعذر تشغيل لوحة الإدارة</h2><p>${esc(e.message)}</p></div>`}})();
