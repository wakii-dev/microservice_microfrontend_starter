// client.ts — pg Pool + drizzle instance (DATABASE_URL, role auth_svc sau SF-5
// init script; trước đó local/CI dùng role superuser boilerplate).
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

export interface Db {
  pool: Pool;
  db: NodePgDatabase;
}

export function createDb(databaseUrl: string): Db {
  const pool = new Pool({
    connectionString: databaseUrl,
    max: 10,
    // fail nhanh thay vì treo boot khi postgres chưa lên
    connectionTimeoutMillis: 5000,
  });
  return { pool, db: drizzle(pool) };
}

export async function closeDb(db: Db): Promise<void> {
  await db.pool.end();
}
