import { Pool, PoolClient } from "pg";
import { databaseConfig } from "./database-config.cjs";

let pool: Pool | null = null;

export function getDbPool(): Pool {
  if (!pool) {
    pool = new Pool({
      ...databaseConfig(),
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }
  return pool;
}

export async function dbQuery<T = any>(text: string, params?: any[]): Promise<T[]> {
  const p = getDbPool();
  const res = await p.query(text, params);
  return res.rows as T[];
}

export async function dbQuerySingle<T = any>(text: string, params?: any[]): Promise<T | null> {
  const rows = await dbQuery<T>(text, params);
  return rows[0] || null;
}


export async function dbTransaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getDbPool().connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally { client.release(); }
}
