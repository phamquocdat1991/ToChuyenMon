import { Pool, type PoolClient } from 'pg';
import { localDatabase } from './local-db';

let pool: Pool | undefined;
export function hasPostgres() {
  return !!process.env.DATABASE_URL;
}

export function getPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL chưa được cấu hình.');
  }
  return (pool ??= new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 3,
    idleTimeoutMillis: 15000,
    connectionTimeoutMillis: 10000,
  }));
}

function translate(sql: string) {
  let index = 0;
  let q = sql.replace(/\?/g, () => '$' + ++index);
  if (/INSERT OR IGNORE/i.test(q)) {
    q = q.replace(/INSERT OR IGNORE/i, 'INSERT') + ' ON CONFLICT DO NOTHING';
  }
  return q;
}

class Statement {
  constructor(readonly sql: string, readonly params: unknown[] = []) {}
  bind(...params: unknown[]) {
    return new Statement(this.sql, params);
  }
  async execute(client?: PoolClient) {
    return (client || getPool()).query(translate(this.sql), this.params);
  }
  async first<T = Record<string, unknown>>() {
    return ((await this.execute()).rows[0] as T) || null;
  }
  async all() {
    return { results: (await this.execute()).rows as any[] };
  }
  async run() {
    const r = await this.execute();
    return { success: true, meta: { changes: r.rowCount || 0 } };
  }
}

export interface StatementInterface {
  bind(...params: unknown[]): StatementInterface;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all(): Promise<{ results: any[] }>;
  run(): Promise<{ success: boolean; meta: { changes: number } }>;
}

export const database = {
  prepare(sql: string): StatementInterface {
    if (hasPostgres()) {
      return new Statement(sql);
    }
    return localDatabase.prepare(sql) as unknown as StatementInterface;
  },

  async batch(statements: any[]): Promise<any[]> {
    if (hasPostgres()) {
      const client = await getPool().connect();
      try {
        await client.query('BEGIN');
        const result = [];
        for (const s of statements) {
          result.push(await s.execute(client));
        }
        await client.query('COMMIT');
        return result;
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    }
    return localDatabase.batch(statements);
  },
};

