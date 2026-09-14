import { connect } from '@tursodatabase/serverless';

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url || !authToken) throw new Error('TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are required');

const db = connect({ url, authToken });

async function run(sql, args = []) {
  await db.run(sql, args);
}

async function columns(table) {
  const rows = await db.all(`PRAGMA table_info(${table})`, []);
  return new Set((rows || []).map(r => String(r.name)));
}

async function addMissingColumns(table, definitions) {
  const existing = await columns(table);
  for (const [name, definition] of Object.entries(definitions)) {
    if (!existing.has(name)) {
      await run(`ALTER TABLE ${table} ADD COLUMN ${name} ${definition}`);
      console.log(`[schema] added ${table}.${name}`);
    }
  }
}

await run(`CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  place_id TEXT NOT NULL,
  user_id TEXT,
  user_name TEXT,
  user_photo TEXT,
  place_name TEXT,
  place_slug TEXT,
  rating INTEGER,
  comment TEXT,
  is_admin_generated INTEGER DEFAULT 0,
  edit_count INTEGER DEFAULT 0,
  created_at INTEGER,
  updated_at INTEGER
)`);
await addMissingColumns('reviews', {
  is_reported: 'INTEGER DEFAULT 0',
  report_count: 'INTEGER DEFAULT 0',
  last_report_reason: 'TEXT',
  reported_at: 'INTEGER',
  last_reporter_name: 'TEXT',
  is_reviewed_by_admin: 'INTEGER DEFAULT 0',
  admin_review_status: 'TEXT',
  admin_review_note: 'TEXT',
  reviewed_at: 'INTEGER'
});
await run('CREATE INDEX IF NOT EXISTS idx_reviews_place_id ON reviews(place_id)');
await run('CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at)');

await run(`CREATE TABLE IF NOT EXISTS offers (
  id TEXT PRIMARY KEY,
  place_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  old_price REAL DEFAULT 0,
  new_price REAL DEFAULT 0,
  discount_percent REAL DEFAULT 0,
  image_url TEXT,
  start_date INTEGER,
  end_date INTEGER,
  status TEXT DEFAULT 'active',
  owner_id TEXT,
  is_verified_place INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  created_at INTEGER,
  updated_at INTEGER
)`);
await run('CREATE INDEX IF NOT EXISTS idx_offers_place ON offers(place_id, created_at DESC)');
await run('CREATE INDEX IF NOT EXISTS idx_offers_status_dates ON offers(status, end_date DESC)');

await run(`CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  place_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price REAL DEFAULT 0,
  old_price REAL DEFAULT 0,
  image_url TEXT,
  category TEXT,
  sku TEXT,
  in_stock INTEGER DEFAULT 1,
  is_featured INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  is_approved INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  created_at INTEGER,
  updated_at INTEGER
)`);
await addMissingColumns('products', { rejection_reason: 'TEXT' });
await run('CREATE INDEX IF NOT EXISTS idx_products_place ON products(place_id, created_at DESC)');
await run('CREATE INDEX IF NOT EXISTS idx_products_status ON products(status)');

await addMissingColumns('places', {
  parent_id: 'TEXT',
  branches_json: 'TEXT',
  availability_status: "TEXT DEFAULT 'available'",
  description_en: 'TEXT',
  address_en: 'TEXT',
  custom_category_en: 'TEXT',
  services_en_json: 'TEXT'
});

await addMissingColumns('users', {
  points: 'INTEGER DEFAULT 0',
  total_earned: 'INTEGER DEFAULT 0',
  loyalty_json: "TEXT DEFAULT '{}'",
  last_daily_bonus_date: 'TEXT',
  last_redemption_at: 'INTEGER'
});

console.log('[schema] Turso public-place API schema repair completed successfully');
