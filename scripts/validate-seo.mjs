import fs from 'fs';
import path from 'path';
const ROOT=process.cwd();
const required=['robots.txt','sitemap.xml','sitemap-places-ar.xml','sitemap-places-en.xml','sitemap-categories-ar.xml','sitemap-categories-en.xml','sitemap-static-ar.xml','sitemap-static-en.xml','indexnow-key.txt','llms.txt','llms-full.txt','llms-en.txt','llms-full-en.txt'];
for(const f of required)if(!fs.existsSync(path.join(ROOT,f)))throw new Error(`Missing SEO asset: ${f}`);
const robots=fs.readFileSync(path.join(ROOT,'robots.txt'),'utf8');
for(const x of ['User-agent: *','User-agent: OAI-SearchBot','User-agent: ClaudeBot','User-agent: PerplexityBot','User-agent: Bingbot','Sitemap: https://dalilmanzala.com/sitemap.xml'])if(!robots.includes(x))throw new Error(`robots.txt missing: ${x}`);
const sm=fs.readFileSync(path.join(ROOT,'sitemap.xml'),'utf8');
for(const x of ['sitemap-places-ar.xml','sitemap-places-en.xml','sitemap-categories-ar.xml','sitemap-categories-en.xml','sitemap-static-ar.xml','sitemap-static-en.xml'])if(!sm.includes(x))throw new Error(`sitemap index missing: ${x}`);
for(const f of ['sitemap-places-ar.xml','sitemap-places-en.xml']){const x=fs.readFileSync(path.join(ROOT,f),'utf8');if(!x.includes('hreflang="ar"')||!x.includes('hreflang="en"'))throw new Error(`${f}: bilingual hreflang missing`);if(!x.includes('<image:image>'))console.warn(`${f}: no image entries found`)}
const en=fs.readFileSync(path.join(ROOT,'en/index.html'),'utf8');if(!/<html lang="en" dir="ltr">/i.test(en))throw new Error('English home language/direction is invalid');if(!en.includes('hreflang="ar"')||!en.includes('hreflang="en"'))throw new Error('English home hreflang missing');if(!en.includes('rel="canonical" href="https://dalilmanzala.com/en/"'))throw new Error('English home canonical is invalid');
const llm=fs.readFileSync(path.join(ROOT,'llms-en.txt'),'utf8');if(!llm.includes('/en/place/{slug}/')||!llm.includes('OAI-SearchBot'))throw new Error('English AI context is incomplete');
console.log('SEO validation passed.');
