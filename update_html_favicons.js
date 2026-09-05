const fs = require('fs');
const path = require('path');

const faviconSnippet = [
  '  <link rel="icon" type="image/x-icon" href="./favicon.ico"/>',
  '  <link rel="icon" type="image/png" sizes="16x16" href="./favicon-16x16.png"/>',
  '  <link rel="icon" type="image/png" sizes="32x32" href="./favicon-32x32.png"/>',
  '  <link rel="icon" type="image/png" sizes="48x48" href="./favicon-48x48.png"/>',
  '  <link rel="icon" type="image/png" sizes="96x96" href="./icons/icon-96x96.png"/>',
  '  <link rel="icon" type="image/png" sizes="192x192" href="./icons/icon-192x192.png"/>',
  '  <link rel="apple-touch-icon" sizes="192x192" href="./apple-touch-icon.png"/>'
].join('\n');

const htmlFiles = fs.readdirSync('.').filter(f => f.endsWith('.html'));

for (const file of htmlFiles) {
  let content = fs.readFileSync(file, 'utf8');

  // Remove previous favicon/apple-touch-icon tags
  content = content.replace(/[ \t]*<link rel="icon"[^>]*>[\r\n]*/gi, '');
  content = content.replace(/[ \t]*<link rel="apple-touch-icon"[^>]*>[\r\n]*/gi, '');

  if (content.includes('<link rel="manifest"')) {
    content = content.replace(/(<link rel="manifest"[^>]*>[\r\n]*)/i, `$1${faviconSnippet}\n`);
  } else if (content.includes('</head>')) {
    content = content.replace('</head>', `${faviconSnippet}\n</head>`);
  }

  fs.writeFileSync(file, content, 'utf8');
  console.log('Successfully updated favicons in:', file);
}
