/**
 * fix-routes.mjs — Fix all old hash-based routes to standalone HTML pages
 */
import fs from 'fs';
import path from 'path';

const root = process.cwd();

const fixes = [
  // ── admin.js ──
  {
    file: 'src/js/ui/pages/admin.js',
    replacements: [
      ["import { navigate } from '../../core/router.js';", '// navigate removed — using direct location.href'],
      ["navigate('/');", "window.location.href = 'index.html';"],
      ["navigate('/login');", "window.location.href = 'login.html';"],
      ['href="#/admin"',             'href="admin.html"'],
      ['href="#/admin/places"',      'href="admin.html?section=places"'],
      ['href="#/admin/verification"','href="admin.html?section=verification"'],
      ['href="#/admin/categories"',  'href="admin.html?section=categories"'],
      ['href="#/admin/users"',       'href="admin.html?section=users"'],
      ['href="#/admin/offers"',      'href="admin.html?section=offers"'],
      ['href="#/admin/ads"',         'href="admin.html?section=ads"'],
      ['href="#/admin/settings"',    'href="admin.html?section=settings"'],
      ['href="#/dashboard"',         'href="dashboard.html"'],
      ['href="#/"',                  'href="index.html"'],
      ['href="#/place/',             'href="place.html?slug='],
    ]
  },

  // ── dashboard.js ──
  {
    file: 'src/js/ui/pages/dashboard.js',
    replacements: [
      ["import { navigate } from '../../core/router.js';", '// navigate removed — using direct location.href'],
      ["navigate('/');",          "window.location.href = 'index.html';"],
      ["navigate('/login');",     "window.location.href = 'login.html';"],
      ["navigate('/dashboard');", "window.location.href = 'dashboard.html';"],
      ['href="#/dashboard"',              'href="dashboard.html"'],
      ['href="#/dashboard/places"',       'href="dashboard.html?section=places"'],
      ['href="#/dashboard/places/add"',   'href="dashboard.html?section=add"'],
      ['href="#/admin"',                  'href="admin.html"'],
      ['href="#/"',                       'href="index.html"'],
      ['href="#/place/',                  'href="place.html?slug='],
    ]
  },

  // ── place.js ──
  {
    file: 'src/js/ui/pages/place.js',
    replacements: [
      ['href="#/places"',                  'href="places.html"'],
      ['href="#/place/',                   'href="place.html?slug='],
      ['href="#/category/',                'href="category.html?slug='],
      ['href="#/dashboard/places/',        'href="dashboard.html?section=places&id='],
      ["url: `/#/`",                       "url: 'https://elmanzala.com/'"],
      ["url: '/#/'",                       "url: 'https://elmanzala.com/'"],
      ["url: `/#/places`",                 "url: 'https://elmanzala.com/places.html'"],
      ["url: '/#/places'",                 "url: 'https://elmanzala.com/places.html'"],
      ["url: `/#/category/${category?.slug || place.categoryId}`", "url: `https://elmanzala.com/category.html?slug=${category?.slug || place.categoryId}`"],
      ["url: `/#/place/${place.slug}`",    "url: `https://elmanzala.com/place.html?slug=${place.slug}`"],
      ["https://elmanzala.com/#/place/",   "https://elmanzala.com/place.html?slug="],
    ]
  },

  // ── home.js ──
  {
    file: 'src/js/ui/pages/home.js',
    replacements: [
      ["import { navigate } from '../../core/router.js';", '// navigate removed'],
      ["navigate('/login');",     "window.location.href = 'login.html';"],
      ["navigate('/dashboard');", "window.location.href = 'dashboard.html';"],
      ['href="#/places"',      'href="places.html"'],
      ['href="#/categories"',  'href="categories.html"'],
      ['href="#/offers"',      'href="offers.html"'],
      ['href="#/search"',      'href="search.html"'],
      ['href="#/login"',       'href="login.html"'],
      ['href="#/dashboard"',   'href="dashboard.html"'],
      ['href="#/place/',       'href="place.html?slug='],
      ['href="#/category/',    'href="category.html?slug='],
    ]
  },

  // ── categories.js ──
  {
    file: 'src/js/ui/pages/categories.js',
    replacements: [
      ["import { navigate } from '../../core/router.js';", '// navigate removed'],
      ["navigate('/');", "window.location.href = 'index.html';"],
      ['href="#/category/', 'href="category.html?slug='],
      ['href="#/categories"', 'href="categories.html"'],
      ['href="#/places"', 'href="places.html"'],
    ]
  },

  // ── search.js ──
  {
    file: 'src/js/ui/pages/search.js',
    replacements: [
      ["import { navigate } from '../../core/router.js';", '// navigate removed'],
      ["navigate('/login');", "window.location.href = 'login.html';"],
      ['href="#/place/', 'href="place.html?slug='],
      ['href="#/places"', 'href="places.html"'],
      ['href="#/category/', 'href="category.html?slug='],
    ]
  },

  // ── offers.js ──
  {
    file: 'src/js/ui/pages/offers.js',
    replacements: [
      ["import { navigate } from '../../core/router.js';", '// navigate removed'],
      ['href="#/place/', 'href="place.html?slug='],
    ]
  },

  // ── products.js ──
  {
    file: 'src/js/ui/pages/products.js',
    replacements: [
      ["import { navigate } from '../../core/router.js';", '// navigate removed'],
      ['href="#/place/', 'href="place.html?slug='],
    ]
  },

  // ── static.js ──
  {
    file: 'src/js/ui/pages/static.js',
    replacements: [
      ["import { navigate } from '../../core/router.js';", '// navigate removed'],
      ["navigate('/');", "window.location.href = 'index.html';"],
      ['href="#/', 'href="index.html'],
    ]
  },

  // ── login.js ──
  {
    file: 'src/js/ui/pages/login.js',
    replacements: [
      ["import { navigate } from '../../core/router.js';", '// navigate removed'],
      ["navigate('/');", "window.location.href = 'index.html';"],
      ["navigate('/dashboard');", "window.location.href = 'dashboard.html';"],
      ["navigate('/dashboard/places')", "window.location.href = 'dashboard.html?section=places'"],
    ]
  },

  // ── PlaceCard.js ──
  {
    file: 'src/js/ui/components/PlaceCard.js',
    replacements: [
      ["import { navigate } from '../../core/router.js';", '// navigate removed'],
      ['href="#/place/', 'href="place.html?slug='],
      ['href="#/category/', 'href="category.html?slug='],
    ]
  },

  // ── services/places.service.js ──
  {
    file: 'src/js/services/places.service.js',
    replacements: [
      ["import { navigate } from '../core/router.js';", '// navigate removed'],
      ["navigate('/login');", "window.location.href = 'login.html';"],
      ["navigate('/dashboard');", "window.location.href = 'dashboard.html';"],
    ]
  },
];

let totalFixed = 0;
fixes.forEach(({ file, replacements }) => {
  const fullPath = path.join(root, file);
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠  SKIP (not found): ${file}`);
    return;
  }
  let content = fs.readFileSync(fullPath, 'utf8');
  let changed = 0;
  replacements.forEach(([from, to]) => {
    if (content.includes(from)) {
      content = content.split(from).join(to);
      changed++;
    }
  });
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`✓  ${file} (${changed} replacements)`);
  totalFixed += changed;
});

console.log(`\n✅ Done — ${totalFixed} total replacements applied.`);
