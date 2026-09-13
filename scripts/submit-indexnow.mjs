import fs from 'fs';
const SITE='https://dalilmanzala.com';
const KEY=fs.readFileSync(new URL('../indexnow-key.txt',import.meta.url),'utf8').trim();
const data=JSON.parse(fs.readFileSync(new URL('../.indexnow-urls.json',import.meta.url),'utf8'));
const urls=[...new Set((data.urls||[]).filter(u=>String(u).startsWith(`${SITE}/`)))];
if(!KEY||!urls.length){console.log('IndexNow: no URLs.');process.exit(0)}
let sent=0;
for(let i=0;i<urls.length;i+=10000){const batch=urls.slice(i,i+10000);const res=await fetch('https://api.indexnow.org/indexnow',{method:'POST',headers:{'content-type':'application/json; charset=utf-8'},body:JSON.stringify({host:'dalilmanzala.com',key:KEY,keyLocation:`${SITE}/indexnow-key.txt`,urlList:batch})});console.log(`IndexNow: HTTP ${res.status}; submitted batch ${i+1}-${i+batch.length}.`);if(!res.ok&&res.status!==202){console.error(await res.text().catch(()=>''));process.exit(1)}sent+=batch.length}
console.log(`IndexNow: submitted ${sent} public profile URLs.`);
