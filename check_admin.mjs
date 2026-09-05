import fs from 'fs';

const content = fs.readFileSync('src/js/ui/pages/admin.js', 'utf8');
const r = /onclick=["']([a-zA-Z0-9_]+)\(/g;
const set = new Set();
let m;
while ((m = r.exec(content)) !== null) {
  set.add(m[1]);
}

console.log('All onclick functions found:', Array.from(set));

const missing = [];
for (const fn of set) {
  const hasWindow = content.includes('window.' + fn);
  const hasFn = content.includes('function ' + fn);
  if (!hasWindow && !hasFn) {
    missing.push(fn);
  } else {
    console.log(`[OK] ${fn} (window: ${hasWindow}, function: ${hasFn})`);
  }
}

console.log('MISSING FUNCTIONS:', missing);
