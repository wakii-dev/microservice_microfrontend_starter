// schema-diff.test.ts — EXIT CRITERION SF-2: migration sinh đúng canonical DDL
// contracts/db/tasks-schema.sql (diff = 0). Không có postgres local → so sánh
// cấu trúc sau chuẩn hoá (bỏ quote/comment/USING btree/NULLS LAST/tên constraint —
// các khác biệt purely-cosmetic giữa 2 cách sinh SQL, không đổi semantics).
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const CANONICAL = resolve(here, '../../../../contracts/db/tasks-schema.sql');
const MIGRATIONS = resolve(here, '../../drizzle');

interface TableDef {
  name: string;
  columns: string[];
  checks: string[];
  // nội bộ parse — CHECK giữ tên constraint để ALTER ... DROP/ADD CONSTRAINT
  // (migration sửa CHECK viết dạng drop + add cùng tên) tác động đúng entry.
  checkDefs: Array<{ name: string; text: string }>;
}

function stripComments(sql: string): string {
  return sql
    .replace(/\r/g, '') // CRLF (Windows checkout) — phá mọi anchor $ phía dưới
    .split('\n')
    .filter((l) => !l.trimStart().startsWith('--'))
    .join('\n')
    .replace(/--> statement-breakpoint/g, '');
}

function splitTopLevel(stmt: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let cur = '';
  for (const ch of stmt) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) {
      parts.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  if (cur.trim()) parts.push(cur);
  return parts.map((p) => p.trim()).filter(Boolean);
}

function unquote(s: string): string {
  return s.replace(/"/g, '');
}

function normType(t: string): string {
  return unquote(t.trim().toLowerCase()).replace(/\s+with\s+time\s+zone/g, ' timestamptz');
}

function normExpr(e: string): string {
  return unquote(e.trim().toLowerCase())
    .replace(/\s*,\s*/g, ',')
    .replace(/\s+/g, ' ')
    .replace(/\btasks\.tasks\./g, ''); // CHECK bên migration qualify đủ tên cột — canonical không
}

function normalizeDdl(sqlText: string): { schemas: string[]; tables: TableDef[]; indexes: string[] } {
  const schemas: string[] = [];
  const tables: TableDef[] = [];
  const indexes: string[] = [];

  for (const rawStmt of stripComments(sqlText).split(';')) {
    const stmt = rawStmt.trim();
    if (!stmt) continue;
    const lower = stmt.toLowerCase();

    if (lower.startsWith('create schema')) {
      schemas.push(unquote(lower.replace(/create schema (if not exists )?/, 'create schema ').trim()));
      continue;
    }

    const idxMatch = stmt.match(
      /^create index (?:if not exists )?(\S+)\s+on\s+(\S+)\s*(?:using btree\s*)?\(([\s\S]+)\)$/i,
    );
    if (idxMatch) {
      const cols = splitTopLevel(idxMatch[3])
        .map((c) =>
          normExpr(c)
            .replace(/\s+desc\s+nulls\s+last/g, ' desc')
            .replace(/\s+asc\s+nulls\s+last/g, '')
            .trim(),
        )
        .sort();
      indexes.push(`${unquote(idxMatch[1]).toLowerCase()} on ${unquote(idxMatch[2]).toLowerCase()} (${cols.join(',')})`);
      continue;
    }

    const tblMatch = stmt.match(
      /^create table (?:if not exists )?((?:"[^"]+"|[\w]+)(?:\.(?:"[^"]+"|[\w]+))?)\s*\(([\s\S]+)\)\s*$/i,
    );
    if (tblMatch) {
      const name = unquote(tblMatch[1]).toLowerCase();
      const def: TableDef = { name, columns: [], checks: [], checkDefs: [] };
      for (const item of splitTopLevel(tblMatch[2])) {
        if (/^constraint /i.test(item) || /^check\s*\(/i.test(item)) {
          const checkBody = item.match(/check\s*\(([\s\S]+)\)/i);
          const cname = item.match(/^constraint\s+(\S+)/i);
          if (checkBody) {
            def.checkDefs.push({
              name: cname ? unquote(cname[1]).toLowerCase() : '',
              text: normExpr(checkBody[1]),
            });
            def.checks = def.checkDefs.map((c) => `check (${c.text})`).sort();
          }
          continue;
        }
        // Column def: name type [primary key] [not null] [default expr] — bố trí lại
        // deterministic (canonical order) để 2 phía so sánh được. Gộp trước
        // "timestamp with time zone" → timestamptz; DEFAULT expr là token kế tiếp.
        const collapsed = item.replace(/\btimestamp\s+with\s+time\s+zone\b/i, 'timestamptz');
        const parts = collapsed.split(/\s+/);
        const colName = unquote(parts[0]).toLowerCase();
        const colType = normType(parts[1]);
        let isPk = false;
        let notNull = false;
        let deflt = '';
        for (let i = 2; i < parts.length; i++) {
          const m = parts[i].trim().toLowerCase();
          if (m === 'primary' && parts[i + 1]?.toLowerCase() === 'key') {
            isPk = true;
            i++;
          } else if (m === 'not' && parts[i + 1]?.toLowerCase() === 'null') {
            notNull = true;
            i++;
          } else if (m === 'default') {
            deflt = `default ${normExpr(parts[i + 1] ?? '')}`;
            i++;
          } else if (m === 'check') {
            // CHECK inline (canonical style) — gom phần còn lại làm check body
            const body = parts.slice(i + 1).join(' ').replace(/^\(/, '').replace(/\)$/, '');
            def.checkDefs.push({ name: '', text: normExpr(body) });
            def.checks = def.checkDefs.map((c) => `check (${c.text})`).sort();
            break;
          }
        }
        if (isPk) notNull = false; // PK ngầm NOT NULL — canonical không ghi
        def.columns.push(
          [colName, colType, isPk ? 'primary key' : '', notNull ? 'not null' : '', deflt]
            .filter(Boolean)
            .join(' '),
        );
      }
      def.columns.sort();
      def.checks.sort();
      tables.push(def);
      continue;
    }

    // ALTER TABLE ... DROP CONSTRAINT x / ADD CONSTRAINT x CHECK (...) — kiểu
    // statement drizzle-kit sinh khi sửa CHECK (SF-2 migration 0001). Net effect
    // trên model: xoá/thêm entry checkDefs theo tên, checks derive lại sorted.
    const alterMatch = stmt.match(
      /^alter table (?:only )?\s*((?:"[^"]*"|[\w]+)(?:\.(?:"[^"]*"|[\w]+))?)\s+([\s\S]+)$/i,
    );
    if (alterMatch) {
      const tableName = unquote(alterMatch[1]).toLowerCase();
      const action = alterMatch[2].trim();
      const table = tables.find((t) => t.name === tableName);
      if (!table) throw new Error(`ALTER TABLE trên bảng chưa parse: ${tableName}`);

      const dropMatch = action.match(/^drop constraint (?:if exists )?(\S+)$/i);
      if (dropMatch) {
        const cname = unquote(dropMatch[1]).toLowerCase();
        table.checkDefs = table.checkDefs.filter((c) => c.name !== cname);
        table.checks = table.checkDefs.map((c) => `check (${c.text})`).sort();
        continue;
      }
      const addMatch = action.match(/^add constraint (\S+) check\s*\(([\s\S]+)\)$/i);
      if (addMatch) {
        table.checkDefs.push({ name: unquote(addMatch[1]).toLowerCase(), text: normExpr(addMatch[2]) });
        table.checks = table.checkDefs.map((c) => `check (${c.text})`).sort();
        continue;
      }
      throw new Error(`Unhandled ALTER TABLE action (mở rộng normalizer): ${action.slice(0, 120)}`);
    }

    throw new Error(`Unhandled DDL statement (mở rộng normalizer): ${stmt.slice(0, 120)}`);
  }

  schemas.sort();
  tables.sort((a, b) => a.name.localeCompare(b.name));
  indexes.sort();
  return { schemas, tables, indexes };
}

describe('migration khớp canonical DDL (exit criterion SF-2: diff = 0)', () => {
  const canonical = normalizeDdl(readFileSync(CANONICAL, 'utf8'));

  function loadMigrated() {
    const { readdirSync } = require('node:fs') as typeof import('node:fs');
    const files = readdirSync(MIGRATIONS)
      .filter((f) => f.endsWith('.sql'))
      .sort();
    expect(files.length).toBeGreaterThan(0);
    const combined = files.map((f) => readFileSync(resolve(MIGRATIONS, f), 'utf8')).join('\n');
    return normalizeDdl(combined);
  }

  it('mọi migration file cộng lại = canonical (outbox whitelist riêng — không đếm vào canonical)', () => {
    const migrated = loadMigrated();
    // Bảng outbox là node-internal infra (ADR-0008) — KHÔNG vào canonical DDL:
    // tách khỏi so sánh canonical, assert expected-def riêng ở test dưới.
    const OUTBOX = 'tasks.outbox';
    const migratedContract = migrated.tables.filter((t) => t.name !== OUTBOX);

    // bảng/schema/index sinh ra bởi migration phải phủ đúng canonical
    expect(migrated.schemas).toEqual(canonical.schemas);
    expect(migratedContract.map((t) => t.name)).toEqual(canonical.tables.map((t) => t.name));
    for (const canonTable of canonical.tables) {
      const migTable = migratedContract.find((t) => t.name === canonTable.name);
      expect(migTable, `table ${canonTable.name} missing`).toBeDefined();
      expect(migTable!.columns, `columns of ${canonTable.name}`).toEqual(canonTable.columns);
      expect(migTable!.checks, `checks of ${canonTable.name}`).toEqual(canonTable.checks);
    }
    expect(migrated.indexes).toEqual(canonical.indexes);
    expect(migrated.tables.map((t) => t.name)).toContain(OUTBOX);
  });

  it('outbox def đúng expected-def riêng (whitelist SF-2 — node-internal infra)', () => {
    const { 'tasks.outbox': outboxTable } = Object.fromEntries(
      loadMigrated()
        .tables.map((t) => [t.name, t]),
    );
    expect(outboxTable).toBeDefined();
    // Cột đúng spec (epic spec rev 3 / context pack sf-2.md mục 3): id UUID do
    // node sinh, type, payload jsonb, created_at, published_at nullable.
    expect(outboxTable!.columns.sort()).toEqual(
      [
        'created_at timestamptz not null default now()',
        'id uuid primary key',
        'payload jsonb not null',
        'published_at timestamptz',
        'type varchar(40) not null',
      ].sort(),
    );
    expect(outboxTable!.checks).toEqual([]); // không CHECK — type do app kiểm soát
  });

  it('sanity: canonical có bảng tasks.tasks + 3 index + KHÔNG outbox', () => {
    expect(canonical.tables.map((t) => t.name)).toContain('tasks.tasks');
    expect(canonical.tables.map((t) => t.name)).not.toContain('tasks.outbox');
    expect(canonical.indexes.length).toBe(3);
  });
});
