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

function withTimeout(promise, ms = 7000) {
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

  // Runtime schema repair is intentionally limited to cheap, read-only checks.
  // DDL such as ALTER TABLE / CREATE INDEX must be handled by explicit migrations,
  // never on the hot request path. Running several DDL statements from every
  // Worker isolate can serialize on SQLite/Turso and cascade into HTTP 500/timeout
  // responses across unrelated API endpoints.
}

function ensureRuntimeSchema(env) {
  if (!env) return Promise.resolve();
  let promise = schemaPromises.get(env);
  if (!promise) {
    let client;
    try {
      client = getTursoClient(env);
    } catch (err) {
      return Promise.reject(err);
    }
    promise = repairRuntimeSchema(env, client).catch(err => {
      // Do not hide the original query failure behind a best-effort repair.
      // The next API statement will surface the real database error.
      console.warn('[Turso schema repair] Notice:', err?.message || err);
    });
    schemaPromises.set(env, promise);
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
