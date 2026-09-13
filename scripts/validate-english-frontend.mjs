import fs from 'fs';
import path from 'path';
const root=process.cwd();
const required=['src/css/en/index.css','src/css/en/base.css','src/css/en/layout.css','src/css/en/components.css','src/css/en/cards.css','src/css/en/forms.css','src/css/en/navigation.css','src/css/en/floating-ui.css','src/css/en/city.css','src/css/en/place.css','src/css/en/responsive.css','src/js/core/english-data.js','src/js/core/english-audit.js','src/js/ui/components/en/PlaceCardEn.js','src/js/ui/pages/en/place-en-v2.js'];
const missing=required.filter(p=>!fs.existsSync(path.join(root,p)));
if(missing.length){console.error('Missing English frontend files:',missing.join(', '));process.exit(1);}
const css=fs.readFileSync(path.join(root,'src/css/en/index.css'),'utf8');
for(const name of ['base.css','layout.css','components.css','cards.css','forms.css','navigation.css','floating-ui.css','city.css','place.css','responsive.css']) if(!css.includes(`./${name}`)){console.error(`English CSS index does not import ${name}`);process.exit(1);}
const generator=fs.readFileSync(path.join(root,'generate-english-pages.mjs'),'utf8');
if(!generator.includes('/src/css/en/index.css')){console.error('English static generator does not load the dedicated English stylesheet');process.exit(1);}
const controller=fs.readFileSync(path.join(root,'src/js/core/english-pages.js'),'utf8');
if(!controller.includes("place-en-v2.js")||!controller.includes('english-audit.js')){console.error('English controller is not using the isolated place renderer/audit');process.exit(1);}
console.log('English frontend structural validation passed.');
