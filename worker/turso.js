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

class TursoD1Statement {
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
    const stmt = await this.client.prepare(this.sql);
    const rows = await stmt.all(this.args);
    return { results: rows };
  }

  async first() {
    const stmt = await this.client.prepare(this.sql);
    return await stmt.get(this.args) ?? null;
  }

  async run() {
    const stmt = await this.client.prepare(this.sql);
    const result = await stmt.run(this.args);
    return {
      success: true,
      meta: {
        changes: Number(result.rowsAffected || 0),
        last_row_id: result.lastInsertRowid ?? null
      }
    };
  }
}

export function createTursoDB(env) {
  const client = getTursoClient(env);

  return {
    prepare(sql) {
      return new TursoD1Statement(client, sql);
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
