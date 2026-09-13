import fs from 'fs';
import path from 'path';
const root=process.cwd();
const required=['src/css/en/index.css','src/css/en/base.css','src/css/en/layout.css','src/css/en/components.css','src/css/en/cards.css','src/css/en/forms.css','src/css/en/navigation.css','src/css/en/floating-ui.css','src/css/en/city.css','src/css/en/place.css','src/css/en/place-media.css','src/css/en/responsive.css','src/js/core/english-data.js','src/js/core/english-audit.js','src/js/core/pwa-install.js','src/js/ui/components/en/PlaceCardEn.js','src/js/ui/pages/en/place-en-v2.js','en/manifest.webmanifest'];
const missing=required.filter(p=>!fs.existsSync(path.join(root,p)));
if(missing.length){console.error('Missing English frontend files:',missing.join(', '));process.exit(1);}
const css=fs.readFileSync(path.join(root,'src/css/en/index.css'),'utf8');
for(const name of ['base.css','layout.css','components.css','cards.css','forms.css','navigation.css','floating-ui.css','city.css','place.css','place-media.css','responsive.css']) if(!css.includes(`./${name}`)){console.error(`English CSS index does not import ${name}`);process.exit(1);}
const generator=fs.readFileSync(path.join(root,'generate-english-pages.mjs'),'utf8');
for(const token of ['/src/css/en/index.css','/en/manifest.webmanifest','firebase-auth-compat.js','pwa-install.js']) if(!generator.includes(token)){console.error(`English static generator is missing ${token}`);process.exit(1);}
const controller=fs.readFileSync(path.join(root,'src/js/core/english-pages.js'),'utf8');
for(const token of ['place-en-v2.js','english-audit.js','PlaceCardEn.js','installEnglishCardBridge','installEnglishFloatingControls','installEnglishAuthHeader']) if(!controller.includes(token)){console.error(`English controller is missing ${token}`);process.exit(1);}
const englishCard=fs.readFileSync(path.join(root,'src/js/ui/components/en/PlaceCardEn.js'),'utf8');
for(const token of ['renderEnglishPlaceCard','projectPlaceToEnglish','getPlaceLiveStatus','data-fallback-src']) if(!englishCard.includes(token)){console.error(`English card component is missing ${token}`);process.exit(1);}
const auth=fs.readFileSync(path.join(root,'src/js/core/auth.js'),'utf8');
for(const token of ['ensureFirebaseReady','signInWithPopup','PERSISTENT_USER_KEY']) if(!auth.includes(token)){console.error(`Auth layer is missing ${token}`);process.exit(1);}
const pwa=fs.readFileSync(path.join(root,'src/js/core/pwa-install.js'),'utf8');
if(!pwa.includes("navigator.serviceWorker.register('/sw.js'")){console.error('PWA installer does not register the unified service worker');process.exit(1);}
const enPages=fs.readdirSync(path.join(root,'src/js/ui/pages/en')).filter(f=>f.endsWith('.js'));
if(!enPages.length){console.error('No English page modules found');process.exit(1);}
console.log(`English frontend structural validation passed (${enPages.length} English page modules).`);
