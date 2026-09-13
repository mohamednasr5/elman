import { connect } from '@tursodatabase/serverless';

const clients = new WeakMap();

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
  // Older production databases used the quoted SQLite column "order" while
  // the current migrations use sort_order. Keep the API compatible with both
  // schemas until every production database has been normalized.
  return String(sql || '')
    .replace(/\bsort_order\b/gi, '"order"');
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

  return {
    prepare(sql) {
      return new TursoStatement(client, sql, env);
    },

    async batch(statements) {
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
