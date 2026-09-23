import { createTursoDB } from './turso.js';

const SITE = 'https://dalilmanzala.com';
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
let lastNominatimRequestAt = 0;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function norm(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[ً-ٰٟ]/g, '')
    .replace(/[إأآا]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[^a-z0-9\u0621-\u064A\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokens(value) {
  return [...new Set(norm(value).split(' ').filter(v => v.length >= 2))];
}

function haversineMeters(aLat,aLng,bLat,bLng) {
  const R=6371000;
  const dLat=(bLat-aLat)*Math.PI/180;
  const dLng=(bLng-aLng)*Math.PI/180;
  const x=Math.sin(dLat/2)**2+Math.cos(aLat*Math.PI/180)*Math.cos(bLat*Math.PI/180)*Math.sin(dLng/2)**2;
  return 2*R*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));
}

function mapsSearchUrl(name,address,placeId='') {
  const query=[name,address].filter(Boolean).join(', ') || address || name || 'المنزلة الدقهلية';
  let url=SITE.replace('dalilmanzala.com','www.google.com') + '/maps/search/?api=1&query=' + encodeURIComponent(query);
  if (placeId) url += '&query_place_id=' + encodeURIComponent(placeId);
  return url;
}

async function findConflicts(db, lat, lng, excludeId='') {
  if (!Number.isFinite(lat)||!Number.isFinite(lng)) return [];
  const dLat=3/111320;
  const dLng=3/(111320*Math.max(0.1,Math.cos(lat*Math.PI/180)));
  const rows=(await db.prepare(
    'SELECT id,name,address,area,latitude,longitude FROM places WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND latitude BETWEEN ? AND ? AND longitude BETWEEN ? AND ? LIMIT 100'
  ).bind(lat-dLat,lat+dLat,lng-dLng,lng+dLng).all().catch(()=>({results:[]}))).results||[];
  return rows.filter(r=>String(r.id)!==String(excludeId||'')).map(r=>({
    ...r,
    distanceMeters:haversineMeters(lat,lng,Number(r.latitude),Number(r.longitude))
  })).filter(r=>r.distanceMeters<=3).sort((a,b)=>a.distanceMeters-b.distanceMeters);
}

function scoreCandidate(candidate, query) {
  const hay=norm([
    candidate.name,
    candidate.display_name,
    candidate.formattedAddress,
    candidate.address?.road,
    candidate.address?.street,
    candidate.address?.neighbourhood,
    candidate.address?.suburb,
    candidate.address?.town,
    candidate.address?.city,
    candidate.address?.village
  ].filter(Boolean).join(' '));
  const qTokens=tokens(query.placeName+' '+query.address+' '+query.area);
  const streetTokens=tokens(query.address);
  const nameTokens=tokens(query.placeName);
  const areaTokens=tokens(query.area);

  const overlap=(arr)=>arr.length ? arr.filter(t=>hay.includes(t)).length/arr.length : 0;
  let score=0;
  score += overlap(areaTokens)*0.25;
  score += overlap(streetTokens)*0.40;
  score += overlap(nameTokens)*0.25;
  const phrase=norm(query.address);
  if(phrase && hay.includes(phrase)) score += 0.10;
  return Math.min(1,score);
}

async function googlePlaces(query, apiKey) {
  const q=[query.placeName,query.address,query.area,'Dakahlia','Egypt'].filter(Boolean).join(', ');
  const response=await fetch('https://places.googleapis.com/v1/places:searchText',{
    method:'POST',
    headers:{
      'Content-Type':'application/json',
      'X-Goog-Api-Key':apiKey,
      'X-Goog-FieldMask':'places.id,places.displayName,places.formattedAddress,places.location,places.addressComponents'
    },
    body:JSON.stringify({textQuery:q,languageCode:'ar',regionCode:'EG',maxResultCount:5})
  });
  if(!response.ok) throw new Error('Google Places HTTP '+response.status);
  const data=await response.json();
  return (data.places||[]).map(p=>({
    provider:'google',
    placeId:p.id||'',
    name:p.displayName?.text||'',
    formattedAddress:p.formattedAddress||'',
    lat:Number(p.location?.latitude),
    lng:Number(p.location?.longitude),
    address:{}
  })).filter(p=>Number.isFinite(p.lat)&&Number.isFinite(p.lng));
}

async function nominatimPlaces(query) {
  const q=[query.placeName,query.address,query.area,'الدقهلية','مصر'].filter(Boolean).join(', ');
  const cacheKey=norm(q);
  const db=query.db;
  const cached=await db.prepare('SELECT result_json FROM geocode_cache WHERE query_key=? LIMIT 1').bind(cacheKey).first().catch(()=>null);
  if(cached?.result_json){
    try{return JSON.parse(cached.result_json).map(v=>({...v,provider:'nominatim-cache'}));}catch(_){}
  }

  const wait=Math.max(0,1050-(Date.now()-lastNominatimRequestAt));
  if(wait) await sleep(wait);
  lastNominatimRequestAt=Date.now();

  const u=new URL(NOMINATIM_URL);
  u.searchParams.set('q',q);
  u.searchParams.set('format','jsonv2');
  u.searchParams.set('addressdetails','1');
  u.searchParams.set('limit','5');
  u.searchParams.set('countrycodes','eg');
  u.searchParams.set('accept-language','ar');

  const response=await fetch(u.toString(),{
    headers:{
      'User-Agent':'DalilManzala/1.0 (https://dalilmanzala.com; local-directory-geocoding)',
      'Referer':SITE+'/'
    }
  });
  if(!response.ok) throw new Error('Nominatim HTTP '+response.status);
  const data=await response.json();
  const mapped=(Array.isArray(data)?data:[]).map(p=>({
    provider:'nominatim',
    placeId:String(p.place_id||''),
    name:p.name||'',
    display_name:p.display_name||'',
    formattedAddress:p.display_name||'',
    lat:Number(p.lat),
    lng:Number(p.lon),
    address:p.address||{}
  })).filter(p=>Number.isFinite(p.lat)&&Number.isFinite(p.lng));

  await db.prepare('INSERT INTO geocode_cache(query_key,query_text,provider,result_json,created_at,updated_at) VALUES(?,?,?,?,?,?) ON CONFLICT(query_key) DO UPDATE SET result_json=excluded.result_json,updated_at=excluded.updated_at')
    .bind(cacheKey,q,'nominatim',JSON.stringify(mapped),Date.now(),Date.now()).run().catch(()=>{});
  return mapped;
}

export async function geocodePlaceAddress({placeName='',address='',area='',excludePlaceId='',env}) {
  const query={placeName:String(placeName||'').trim(),address:String(address||'').trim(),area:String(area||'').trim(),db:createTursoDB(env)};
  if(!query.address && !query.placeName) return {success:false,error:'العنوان أو اسم المكان مطلوب'};

  let candidates=[];
  let provider='nominatim';
  if(env?.GOOGLE_MAPS_API_KEY){
    try{
      candidates=await googlePlaces(query,env.GOOGLE_MAPS_API_KEY);
      provider='google';
    }catch(err){ console.warn('[Geocode] Google Places fallback:',err?.message||err); }
  }
  if(!candidates.length){
    candidates=await nominatimPlaces(query);
    provider='nominatim';
  }

  const scored=candidates.map(c=>({...c,score:scoreCandidate(c,query)})).sort((a,b)=>b.score-a.score);
  if(!scored.length) return {success:false,error:'لم يتم العثور على موقع موثوق لهذا العنوان',candidates:[]};

  const best=scored[0];
  const second=scored[1];
  const margin=second ? best.score-second.score : best.score;
  const confident=best.score>=0.58 && (!second || margin>=0.12);

  const conflicts=await findConflicts(query.db,best.lat,best.lng,excludePlaceId);
  const conflict=conflicts[0]||null;

  const candidates = [];
  for (const candidate of scored.slice(0,5)) {
    const candidateConflicts = await findConflicts(query.db, candidate.lat, candidate.lng, excludePlaceId);
    const candidateConflict = candidateConflicts[0] || null;
    candidates.push({
      lat:candidate.lat,
      lng:candidate.lng,
      name:candidate.name,
      formattedAddress:candidate.formattedAddress||candidate.display_name||'',
      score:Number(candidate.score.toFixed(3)),
      placeId:candidate.placeId||'',
      provider:candidate.provider,
      coordinateConflict:candidateConflict ? {
        id:candidateConflict.id,
        name:candidateConflict.name,
        address:candidateConflict.address,
        area:candidateConflict.area,
        distanceMeters:Number(candidateConflict.distanceMeters.toFixed(2))
      } : null,
      safe: !candidateConflict
    });
  }

  return {
    success:true,
    provider,
    confidence:best.score,
    margin,
    requiresConfirmation:!confident || Boolean(conflict),
    coordinateConflict:conflict ? {
      id:conflict.id,name:conflict.name,address:conflict.address,area:conflict.area,distanceMeters:Number(conflict.distanceMeters.toFixed(2))
    } : null,
    selected:confident && !conflict ? {
      lat:best.lat,lng:best.lng,provider:best.provider,placeId:best.placeId||'',
      formattedAddress:best.formattedAddress||best.display_name||'',
      mapsLink:mapsSearchUrl(query.placeName,query.address,best.provider==='google'?best.placeId:'')
    } : null,
    candidates
  };
}
