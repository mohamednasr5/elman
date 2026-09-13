import fs from 'fs';
const SITE='https://dalilmanzala.com';
const KEY=fs.readFileSync(new URL('../indexnow-key.txt',import.meta.url),'utf8').trim();
const data=JSON.parse(fs.readFileSync(new URL('../.indexnow-urls.json',import.meta.url),'utf8'));
const urls=[...new Set((data.urls||[]).filter(u=>String(u).startsWith(`${SITE}/`)))];
if(!KEY||!urls.length){console.log('IndexNow: no URLs.');process.exit(0)}
let sent=0;
for(let i=0;i<urls.length;i+=10000){const batch=urls.slice(i,i+10000);const res=await fetch('https://api.indexnow.org/indexnow',{method:'POST',headers:{'content-type':'application/json; charset=utf-8'},body:JSON.stringify({host:'dalilmanzala.com',key:KEY,keyLocation:`${SITE}/indexnow-key.txt`,urlList:batch})});const text=await res.text().catch(()=> '');console.log(`IndexNow: HTTP ${res.status}; batch ${i+1}-${i+batch.length}.`);if(!res.ok&&res.status!==202){if(res.status===403&&text.includes('SiteVerificationNotCompleted')){console.warn('IndexNow verification is still propagating; the URL submission will be retried on the next scheduled SEO run.');break}console.error(text);process.exit(1)}sent+=batch.length}
console.log(`IndexNow: accepted ${sent} public profile URLs.`);
