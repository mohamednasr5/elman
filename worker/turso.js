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

function normalizeArgs(args) {
  return (args || []).map(value => value === undefined ? null : value);
}

class TursoStatement {
  constructor(client, sql) {
    this.client = client;
    this.sql = sql;
    this.args = [];
  }

  bind(...args) {
    this.args = normalizeArgs(args);
    return this;
  }

  async all() {
    try {
      const rows = typeof this.client.all === 'function'
        ? await this.client.all(this.sql, this.args)
        : await (await this.client.prepare(this.sql)).all(this.args);
      return { results: rows };
    } catch (err) {
      console.error('[TursoDB Error] all():', err?.message || err, 'SQL:', this.sql);
      throw err;
    }
  }

  async first() {
    try {
      const row = typeof this.client.get === 'function'
        ? await this.client.get(this.sql, this.args)
        : await (await this.client.prepare(this.sql)).get(this.args);
      return row ?? null;
    } catch (err) {
      console.error('[TursoDB Error] first():', err?.message || err, 'SQL:', this.sql);
      throw err;
    }
  }

  async run() {
    try {
      const result = typeof this.client.run === 'function'
        ? await this.client.run(this.sql, this.args)
        : await (await this.client.prepare(this.sql)).run(this.args);
      return {
        success: true,
        meta: {
          changes: Number(result?.rowsAffected || 0),
          last_row_id: result?.lastInsertRowid ?? null
        }
      };
    } catch (err) {
      console.error('[TursoDB Error] run():', err?.message || err, 'SQL:', this.sql);
      throw err;
    }
  }
}

export function createTursoDB(env) {
  const client = getTursoClient(env);

  return {
    prepare(sql) {
      return new TursoStatement(client, sql);
    },

    async batch(statements) {
      const batch = statements.map(statement => ({
        sql: statement.sql,
        args: normalizeArgs(statement.args)
      }));

      return client.batch(batch, 'write');
    }
  };
}

export async function checkTursoHealth(env) {
  const db = createTursoDB(env);
  const result = await db.prepare('SELECT 1 AS ok').all();
  return result.results?.[0]?.ok === 1;
}
