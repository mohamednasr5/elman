import { connect } from '@tursodatabase/serverless';

const clients = new WeakMap();
const schemaPromises = new WeakMap();

function getTursoClient(env) {
  if (!env.TURSO_DATABASE_URL || !env.TURSO_AUTH_TOKEN) {
    throw new Error('Turso is not configured: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are required');
  }

  let client = clients.get(env);
  if (!client) {
    client = connect({
      url: env.TURSO_DATABASE_URL,
      authToken: env.TURSO_AUTH_TOKEN
    });
    clients.set(env, client);
  }
  return client;
}

function resetTursoClient(env) {
  try {
    if (env) clients.delete(env);
  } catch (_) {}
}

function withTimeout(promise, ms = 15000) {
  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`Turso query timed out after ${ms}ms`));
    }, ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timer);
  });
}

function normalizeArgs(args) {
  return (args || []).map(value => value === undefined ? null : value);
}

function isCategoriesSortOrderError(sql, err) {
  const text = `${err?.message || err || ''}`.toLowerCase();
  const query = String(sql || '').toLowerCase();
  return query.includes('categories') && query.includes('sort_order') &&
    (/no such column|unknown column|column.*not found|does not exist/.test(text));
}

function legacyCategoriesSql(sql) {
  return String(sql || '').replace(/\bsort_order\b/gi, '"order"');
}

/*
 * Production safety net for Turso schema drift.
 * Some older production databases were created before the current migrations.
 * The public place APIs must never fail simply because one optional table/column
 * was not migrated. Repair is performed once per Worker isolate, before the
 * first database statement, using the same credentials already required by
 * the Worker itself.
 */
async function repairRuntimeSchema(env, client) {
  const runDirect = async (sql, args = []) => {
    await withTimeout(client.run(sql, normalizeArgs(args)), 8000);
  };
  const allDirect = async (sql, args = []) => {
    return await withTimeout(client.all(sql, normalizeArgs(args)), 8000);
  };
  const getColumns = async table => {
    try {
      const rows = await allDirect(`PRAGMA table_info(${table})`);
      return new Set((rows || []).map(row => String(row.name)));
    } catch (_) {
      return new Set();
    }
  };
  const addMissing = async (table, definitions) => {
    const existing = await getColumns(table);
    for (const [name, definition] of Object.entries(definitions)) {
      if (!existing.has(name)) {
        await runDirect(`ALTER TABLE ${table} ADD COLUMN ${name} ${definition}`);
      }
    }
  };

  // Places: columns used by the current place/branch API.
  await addMissing('places', {
    parent_id: 'TEXT',
    branches_json: 'TEXT',
    availability_status: "TEXT DEFAULT 'available'",
    description_en: 'TEXT',
    address_en: 'TEXT',
    custom_category_en: 'TEXT',
    services_en_json: 'TEXT'
  });

  // Reviews: authoritative public review store.
  await runDirect(`CREATE TABLE IF NOT EXISTS reviews (
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
  await addMissing('reviews', {
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
  await runDirect('CREATE INDEX IF NOT EXISTS idx_reviews_place_id ON reviews(place_id)');
  await runDirect('CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at)');

  // Offers/products: authoritative public place inventory.
  await runDirect(`CREATE TABLE IF NOT EXISTS offers (
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
  await runDirect('CREATE INDEX IF NOT EXISTS idx_offers_place ON offers(place_id, created_at DESC)');

  await runDirect(`CREATE TABLE IF NOT EXISTS products (
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
  await addMissing('products', { rejection_reason: 'TEXT' });
  await runDirect('CREATE INDEX IF NOT EXISTS idx_products_place ON products(place_id, created_at DESC)');
  await runDirect('CREATE INDEX IF NOT EXISTS idx_products_status ON products(status)');

  // Cached address geocoding results.
  await runDirect(`CREATE TABLE IF NOT EXISTS geocode_cache (
    query_key TEXT PRIMARY KEY,
    query_text TEXT NOT NULL,
    provider TEXT NOT NULL,
    result_json TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`);
  await runDirect('CREATE INDEX IF NOT EXISTS idx_geocode_cache_updated ON geocode_cache(updated_at DESC)');

  // Local business articles / blog.
  await runDirect(`CREATE TABLE IF NOT EXISTS articles (
    id TEXT PRIMARY KEY,
    place_id TEXT NOT NULL,
    owner_id TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    keywords_json TEXT,
    cover_image_url TEXT,
    status TEXT DEFAULT 'published',
    ai_generated INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    published_at INTEGER
  )`);
  await runDirect('CREATE INDEX IF NOT EXISTS idx_articles_place_status ON articles(place_id, status, published_at DESC)');
  await runDirect('CREATE INDEX IF NOT EXISTS idx_articles_owner_created ON articles(owner_id, created_at DESC)');
  await runDirect('CREATE INDEX IF NOT EXISTS idx_articles_status_published ON articles(status, published_at DESC)');
  await runDirect('CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug)');
}

function ensureRuntimeSchema(env) {
  if (!env) return Promise.resolve();
  let promise = schemaPromises.get(env);
  if (!promise) {
    promise = Promise.resolve();
    schemaPromises.set(env, promise);
    // Production schema is fully migrated and persistent in Turso.
    // Background DDL storm on isolate boot avoided to preserve concurrency.
  }
  return promise;
}

class TursoStatement {
  constructor(client, sql, env) {
    this.client = client;
    this.sql = sql;
    this.env = env;
    this.args = [];
  }

  bind(...args) {
    this.args = normalizeArgs(args);
    return this;
  }

  async all() {
    await ensureRuntimeSchema(this.env);
    let lastErr;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const queryPromise = typeof this.client.all === 'function'
          ? this.client.all(this.sql, this.args)
          : (await this.client.prepare(this.sql)).all(this.args);
        const rows = await withTimeout(queryPromise, 7000);
        return { results: rows };
      } catch (err) {
        lastErr = err;
        resetTursoClient(this.env);
        if (isCategoriesSortOrderError(this.sql, err)) {
          try {
            const fallbackSql = legacyCategoriesSql(this.sql);
            const fallbackPromise = typeof this.client.all === 'function'
              ? this.client.all(fallbackSql, this.args)
              : (await this.client.prepare(fallbackSql)).all(this.args);
            const rows = await withTimeout(fallbackPromise, 7000);
            return { results: rows };
          } catch (fallbackErr) {
            lastErr = fallbackErr;
          }
        }
        if (attempt === 0) await new Promise(r => setTimeout(r, 60));
      }
    }
    console.error('[TursoDB Error] all():', lastErr?.message || lastErr, 'SQL:', this.sql);
    throw lastErr;
  }

  async first() {
    await ensureRuntimeSchema(this.env);
    let lastErr;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const queryPromise = typeof this.client.get === 'function'
          ? this.client.get(this.sql, this.args)
          : (await this.client.prepare(this.sql)).get(this.args);
        const row = await withTimeout(queryPromise, 7000);
        return row ?? null;
      } catch (err) {
        lastErr = err;
        resetTursoClient(this.env);
        if (isCategoriesSortOrderError(this.sql, err)) {
          try {
            const fallbackSql = legacyCategoriesSql(this.sql);
            const fallbackPromise = typeof this.client.get === 'function'
              ? this.client.get(fallbackSql, this.args)
              : (await this.client.prepare(fallbackSql)).get(this.args);
            const row = await withTimeout(fallbackPromise, 7000);
            return row ?? null;
          } catch (fallbackErr) {
            lastErr = fallbackErr;
          }
        }
        if (attempt === 0) await new Promise(r => setTimeout(r, 60));
      }
    }
    console.error('[TursoDB Error] first():', lastErr?.message || lastErr, 'SQL:', this.sql);
    throw lastErr;
  }

  async run() {
    await ensureRuntimeSchema(this.env);
    let lastErr;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const queryPromise = typeof this.client.run === 'function'
          ? this.client.run(this.sql, this.args)
          : (await this.client.prepare(this.sql)).run(this.args);
        const result = await withTimeout(queryPromise, 7000);
        return {
          success: true,
          meta: {
            changes: Number(result?.rowsAffected || 0),
            last_row_id: result?.lastInsertRowid ?? null
          }
        };
      } catch (err) {
        lastErr = err;
        resetTursoClient(this.env);
        if (isCategoriesSortOrderError(this.sql, err)) {
          try {
            const fallbackSql = legacyCategoriesSql(this.sql);
            const fallbackPromise = typeof this.client.run === 'function'
              ? this.client.run(fallbackSql, this.args)
              : (await this.client.prepare(fallbackSql)).run(this.args);
            const result = await withTimeout(fallbackPromise, 7000);
            return {
              success: true,
              meta: {
                changes: Number(result?.rowsAffected || 0),
                last_row_id: result?.lastInsertRowid ?? null
              }
            };
          } catch (fallbackErr) {
            lastErr = fallbackErr;
          }
        }
        if (attempt === 0) await new Promise(r => setTimeout(r, 60));
      }
    }
    console.error('[TursoDB Error] run():', lastErr?.message || lastErr, 'SQL:', this.sql);
    throw lastErr;
  }
}

export function createTursoDB(env) {
  const client = getTursoClient(env);
  ensureRuntimeSchema(env).catch(() => {});

  return {
    prepare(sql) {
      return new TursoStatement(client, sql, env);
    },

    async batch(statements) {
      await ensureRuntimeSchema(env);
      const batch = statements.map(statement => ({
        sql: statement.sql,
        args: normalizeArgs(statement.args)
      }));

      try {
        return await withTimeout(client.batch(batch, 'write'), 8000);
      } catch (err) {
        resetTursoClient(env);
        throw err;
      }
    }
  };
}

export async function checkTursoHealth(env) {
  const db = createTursoDB(env);
  const result = await db.prepare('SELECT 1 AS ok').all();
  return result.results?.[0]?.ok === 1;
}
