// migrate.ts — SQL-file migration runner (mirror node-svc db/migrate.ts).
//
// VÌ KHÔNG DÙNG drizzle migrator: PgDialect.migrate luôn phát
// `CREATE SCHEMA IF NOT EXISTS "<migrationsSchema>"` — statement này cần
// CREATE trên DATABASE (role auth_svc chỉ có CREATE trên schema auth —
// init script SF-5; local/CI dùng boilerplate) → permission denied lúc boot.
// Runner này: thử CREATE SCHEMA, chấp nhận khi schema đã tồn tại; tracking
// trong auth.migrations_history; statement parse đúng marker của drizzle-kit
// nên vẫn generate migration bằng `pnpm exec drizzle-kit generate` như thường.
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

/**
 * Đảm bảo schema `auth` tồn tại. Thử CREATE — permission denied (role chỉ có
 * CREATE trên schema, init script SF-5 tạo trước) → chấp nhận KHI schema thật
 * sự đã tồn tại (PG check privilege trước existence notice, kể cả IF NOT
 * EXISTS); chưa tồn tại thật sự thì rethrow (không nuốt lỗi).
 */
async function ensureAuthSchema(db: NodePgDatabase): Promise<void> {
  try {
    await db.execute(sql`create schema if not exists auth`);
  } catch (err) {
    const check = await db.execute(sql`select to_regnamespace('auth') is not null as ok`);
    if (!check.rows[0]?.ok) throw err;
  }
}

export async function runMigrations(db: NodePgDatabase, migrationsFolder: string): Promise<string[]> {
  // History table nằm TRONG schema auth — schema phải có trước (fresh DB:
  // statement đầu của file 0000 chưa chạy tới lúc này).
  await ensureAuthSchema(db);
  await db.execute(
    sql`create table if not exists auth.migrations_history (name text primary key, applied_at timestamptz not null default now())`,
  );
  const applied = new Set<string>(
    (await db.execute(sql`select name from auth.migrations_history`)).rows.map(
      (r) => r.name as string,
    ),
  );

  const files = readdirSync(migrationsFolder)
    .filter((f) => f.endsWith('.sql'))
    .sort();
  const ran: string[] = [];

  for (const file of files) {
    if (applied.has(file)) continue;
    const content = readFileSync(path.join(migrationsFolder, file), 'utf8');
    const statements = content
      .split('--> statement-breakpoint')
      .map((s) => s.trim())
      .filter(Boolean);

    for (const stmt of statements) {
      if (/^create schema/i.test(stmt)) {
        // Statement CREATE SCHEMA trong file — cùng luật: thử chạy (setup mới,
        // role có quyền), schema đã tồn tại → chấp nhận, chưa tồn tại thật sự
        // → rethrow. (Match cả `IF NOT EXISTS` lẫn không — tuỳ version
        // drizzle-kit sinh.)
        await ensureAuthSchema(db);
        continue;
      }
      await db.execute(sql.raw(stmt));
    }

    await db.execute(sql`insert into auth.migrations_history (name) values (${file})`);
    ran.push(file);
  }
  return ran;
}
