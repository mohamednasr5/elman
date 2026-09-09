import fs from 'fs';
import { execSync } from 'child_process';

const filesToMinify = [
  { pretty: 'src/css/main.pretty.css', target: 'src/css/main.css', isCss: true },
  { pretty: 'src/js/core/db.pretty.js', target: 'src/js/core/db.js' },
  { pretty: 'src/js/core/page-shell.pretty.js', target: 'src/js/core/page-shell.js' },
  { pretty: 'src/js/ui/pages/home.pretty.js', target: 'src/js/ui/pages/home.js' },
  { pretty: 'src/js/utils/category-visual.pretty.js', target: 'src/js/utils/category-visual.js' },
  { pretty: 'src/js/utils/professions-data.pretty.js', target: 'src/js/utils/professions-data.js' }
];

console.log('--- Starting Automated Minification ---');

for (const item of filesToMinify) {
  if (!fs.existsSync(item.pretty)) {
    if (fs.existsSync(item.target)) {
      fs.copyFileSync(item.target, item.pretty);
      console.log(`Backed up readable source: ${item.target} -> ${item.pretty}`);
    }
  }

  if (fs.existsSync(item.pretty)) {
    const srcSize = fs.statSync(item.pretty).size;
    execSync(`npx esbuild "${item.pretty}" --minify --outfile="${item.target}"`, { stdio: 'inherit' });
    const minSize = fs.statSync(item.target).size;
    const savings = (((srcSize - minSize) / srcSize) * 100).toFixed(1);
    console.log(`Minified ${item.target}: ${(srcSize/1024).toFixed(1)} KB -> ${(minSize/1024).toFixed(1)} KB (-${savings}%)`);
  }
}

console.log('--- Minification Complete ---');
