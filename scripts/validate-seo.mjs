import fs from 'fs';
import path from 'path';

const ROOT=process.cwd();
const required=['robots.txt','sitemap.xml','sitemap-places-ar.xml','sitemap-places-en.xml','sitemap-categories-ar.xml','sitemap-categories-en.xml','sitemap-static-ar.xml','sitemap-static-en.xml','indexnow-key.txt','llms.txt','llms-full.txt','llms-en.txt','llms-full-en.txt'];
for(const f of required)if(!fs.existsSync(path.join(ROOT,f)))throw new Error(`Missing SEO asset: ${f}`);

const read=f=>fs.readFileSync(path.join(ROOT,f),'utf8');
const must=(ok,msg)=>{if(!ok)throw new Error(msg)};

function validateXml(file){
  const x=read(file);
  must(x.includes('<?xml'),`${file}: invalid XML header`);
  must(x.includes('<urlset')||x.includes('<sitemapindex'),`${file}: missing XML root`);
  must(!/<loc>[^<]*(undefined|null)/i.test(x),`${file}: invalid URL token`);
  return x;
}

const robots=read('robots.txt');
for(const x of ['User-agent: *','User-agent: Googlebot','User-agent: OAI-SearchBot','User-agent: Bingbot','Sitemap: https://dalilmanzala.com/sitemap.xml'])must(robots.includes(x),`robots.txt missing: ${x}`);
must(!/Disallow:\s*\/place\//i.test(robots),'robots.txt must not disallow /place/');

const sm=validateXml('sitemap.xml');
for(const x of ['sitemap-places-ar.xml','sitemap-places-en.xml','sitemap-categories-ar.xml','sitemap-categories-en.xml','sitemap-static-ar.xml','sitemap-static-en.xml'])must(sm.includes(x),`sitemap index missing: ${x}`);

for(const f of ['sitemap-places-ar.xml','sitemap-places-en.xml','sitemap-categories-ar.xml','sitemap-categories-en.xml']){
  const x=validateXml(f);
  must(x.includes('xmlns:xhtml='),`${f}: xhtml namespace missing`);
  must(x.includes('hreflang="ar"')&&x.includes('hreflang="en"'),`${f}: bilingual hreflang missing`);
  must(!x.includes('&amp;apos;'),`${f}: malformed double escaping`);
  if (f.includes('categories')) must(/\/category\/[^<\s]+\//.test(x) && !/\/category\/[^<\s]*[^\/]<\/loc>/.test(x),'Category sitemap contains a non-canonical URL');
}

const en=read('en/index.html');
must(/<html lang="en" dir="ltr">/i.test(en),'English home language/direction is invalid');
must(en.includes('hreflang="ar"')&&en.includes('hreflang="en"'),'English home hreflang missing');
must(en.includes('rel="canonical" href="https://dalilmanzala.com/en/"'),'English home canonical is invalid');

const llmAr=read('llms.txt');
must(!/support electronic and cash payment methods|accepted everywhere/i.test(llmAr),'AI context must not make universal payment claims');
must(llmAr.includes('Do not infer a payment method'),'Arabic AI context accuracy rules missing');
const llm=read('llms-en.txt');
must(llm.includes('/en/place/{slug}/')&&llm.includes('OAI-SearchBot'),'English AI context is incomplete');

const redirects=read('_redirects');
must(redirects.includes('/place/*')&&redirects.includes('/category/*'),'Public place/category routes missing');

const entity=read('src/js/utils/seo-entity.js');
must((entity.includes("'@type': 'LocalBusiness'")||entity.includes("return 'LocalBusiness'"))&&entity.includes("'@type': 'BreadcrumbList'"),'Required structured data generators missing');
must(entity.includes('generateBusinessSEOEnglish'),'English business SEO generator missing');
must(!entity.includes("'@type': 'FAQPage'"),'FAQPage schema should not be emitted as a Google rich-result strategy');
must(!entity.includes('31.1578') || !entity.includes('32.0333'),'SEO generator must not use guessed city-centre coordinates as business coordinates');

const builder=read('build-seo-pages.mjs');
const englishBuilder=read('generate-english-pages.mjs');
must(englishBuilder.includes('generateBusinessSEOEnglish')&&englishBuilder.includes('Questions &amp; answers'),'English profiles must contain entity metadata and crawlable Q&A');
const workflow=read('.github/workflows/generate-english-pages.yml');
must(workflow.includes('node build-seo-pages.mjs'),'Bilingual SEO workflow must regenerate Arabic static profiles');
for(const needle of ['Semantic Body Content (Discoverable immediately without JS execution)','Crawlable Breadcrumb Navigation','Related Places in Same Category','Inject Internal Links into places.html','AEO/GEO answer block','${qaHtml}'])must(builder.includes(needle),`build-seo-pages.mjs missing ${needle}`);

console.log('SEO validation passed.');
