import fs from 'fs';
const SITE='https://dalilmanzala.com';
const KEY=fs.readFileSync(new URL('../indexnow-key.txt',import.meta.url),'utf8').trim();
const data=JSON.parse(fs.readFileSync(new URL('../.indexnow-urls.json',import.meta.url),'utf8'));
const urls=[...new Set((data.urls||[]).filter(u=>String(u).startsWith(`${SITE}/`)))].slice(0,10000);
if(!KEY||!urls.length){console.log('IndexNow: no URLs.');process.exit(0)}
const res=await fetch('https://api.indexnow.org/indexnow',{method:'POST',headers:{'content-type':'application/json; charset=utf-8'},body:JSON.stringify({host:'dalilmanzala.com',key:KEY,keyLocation:`${SITE}/indexnow-key.txt`,urlList:urls})});
console.log(`IndexNow: HTTP ${res.status}; submitted ${urls.length} URLs.`);
if(!res.ok&&res.status!==202){console.error(await res.text().catch(()=>''));process.exit(1)}
