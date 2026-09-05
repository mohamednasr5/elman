const fs = require('fs');

const ogSnippet = [
  '  <meta property="og:image" content="https://dalilmanzala.com/og-image.png"/>',
  '  <meta property="og:image:width" content="1200"/>',
  '  <meta property="og:image:height" content="630"/>',
  '  <meta name="twitter:image" content="https://dalilmanzala.com/og-image.png"/>'
].join('\n');

const htmlFiles = fs.readdirSync('.').filter(f => f.endsWith('.html'));

for (const file of htmlFiles) {
  let content = fs.readFileSync(file, 'utf8');

  // Remove existing og:image / twitter:image tags
  content = content.replace(/[ \t]*<meta property="og:image"[^>]*>[\r\n]*/gi, '');
  content = content.replace(/[ \t]*<meta property="og:image:width"[^>]*>[\r\n]*/gi, '');
  content = content.replace(/[ \t]*<meta property="og:image:height"[^>]*>[\r\n]*/gi, '');
  content = content.replace(/[ \t]*<meta name="twitter:image"[^>]*>[\r\n]*/gi, '');

  // Insert after twitter:card if exists, or before </head>
  if (content.includes('<meta name="twitter:card"')) {
    content = content.replace(/(<meta name="twitter:card"[^>]*>[\r\n]*)/i, `$1${ogSnippet}\n`);
  } else if (content.includes('</head>')) {
    content = content.replace('</head>', `${ogSnippet}\n</head>`);
  }

  fs.writeFileSync(file, content, 'utf8');
  console.log('Updated OG tags in:', file);
}
