// migrate.ts — SQL-file migration runner.
//
// VÌ KHÔNG DÙNG drizzle migrator: PgDialect.migrate luôn phát
// `CREATE SCHEMA IF NOT EXISTS "<migrationsSchema>"` — statement này cần
// CREATE trên DATABASE (node_svc chỉ có CREATE trên schema tasks, xem
// platform/postgres/init/01-init.sh) → permission denied lúc boot (CI run
// 38229973307). Runner này: thử CREATE SCHEMA, chấp nhận khi schema đã tồn
// tại (tạo bởi init script); tracking trong tasks.migrations_history (role
// node_svc sở hữu); statement parse đúng marker của drizzle-kit nên vẫn
// generate migration bằng `pnpm exec drizzle-kit generate` như thường.
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

export async function runMigrations(db: NodePgDatabase, migrationsFolder: string): Promise<string[]> {
  await db.execute(
    sql`create table if not exists tasks.migrations_history (name text primary key, applied_at timestamptz not null default now())`,
  );
  const applied = new Set<string>(
    (await db.execute(sql`select name from tasks.migrations_history`)).rows.map(
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
      if (/^create schema if not exists/i.test(stmt)) {
        // Schema do init script tạo trước (compose fresh volume). Role migration
        // không có CREATE trên database → statement này permission denied dù
        // IF NOT EXISTS (PG check privilege trước existence notice). Thử chạy
        // (cho setup mới); schema đã tồn tại → chấp nhận, nếu chưa tồn tại
        // thật sự thì rethrow (không nuốt lỗi).
        try {
          await db.execute(sql.raw(stmt));
        } catch (err) {
          const check = await db.execute(
            sql`select to_regnamespace('tasks') is not null as ok`,
          );
          if (!check.rows[0]?.ok) throw err;
        }
        continue;
      }
      await db.execute(sql.raw(stmt));
    }

    await db.execute(sql`insert into tasks.migrations_history (name) values (${file})`);
    ran.push(file);
  }
  return ran;
}
