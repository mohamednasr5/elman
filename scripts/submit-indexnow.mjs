import fs from 'fs';
const SITE='https://dalilmanzala.com';
const KEY=fs.readFileSync(new URL('../indexnow-key.txt',import.meta.url),'utf8').trim();
const data=JSON.parse(fs.readFileSync(new URL('../.indexnow-urls.json',import.meta.url),'utf8'));
const urls=[...new Set((data.urls||[]).filter(u=>String(u).startsWith(`${SITE}/`)))];
if(!KEY||!urls.length){console.log('IndexNow: no URLs.');process.exit(0)}
let sent=0;
for(let i=0;i<urls.length;i+=10000){
  const batch=urls.slice(i,i+10000);
  const body=JSON.stringify({host:'dalilmanzala.com',key:KEY,keyLocation:`${SITE}/indexnow-key.txt`,urlList:batch});
  let res, text = '';
  const endpoints=['https://api.indexnow.org/indexnow','https://www.bing.com/indexnow'];
  for(const ep of endpoints){
    try {
      res=await fetch(ep,{method:'POST',headers:{'content-type':'application/json; charset=utf-8'},body});
      text=await res.text().catch(()=> '');
      if(res.ok || res.status === 202) {
        console.log(`IndexNow (${ep}): HTTP ${res.status}; batch ${i+1}-${i+batch.length}.`);
        break;
      }
    } catch(err) {
      console.warn(`IndexNow fetch failed for ${ep}:`, err.message);
    }
  }
  if(!res || (!res.ok && res.status!==202)){
    if(res && res.status===403 && text.includes('SiteVerificationNotCompleted')){
      console.warn('IndexNow verification is still propagating; the URL submission will be retried on the next scheduled SEO run.');
      break;
    }
    console.warn(`IndexNow submission non-fatal notice: ${text || 'network timeout'}`);
    break;
  }
  sent+=batch.length;
}
console.log(`IndexNow: accepted ${sent} public profile URLs.`);

console.log('Daily IndexNow submission cycle complete.');
