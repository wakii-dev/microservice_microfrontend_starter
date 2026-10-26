// repo.drizzle.test.ts — transactional outbox wiring của DrizzleTaskRepo (SF-2
// FI-79). Không postgres local → mock NodePgDatabase: transaction() chạy callback
// trên working-copy, COMMIT chỉ khi callback thành công; throw (seam fail ở
// bước outbox insert) = ROLLBACK — task + outbox CÙNG biến mất. Rollback thật
// của postgres được chứng minh ở CI kafka boot-smoke + e2e (Rule 0 evidence).
import { describe, expect, it } from 'vitest';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { outbox, tasks } from './db/schema.js';
import { DrizzleTaskRepo, escapeLike } from './repo.drizzle.js';

interface RowRec {
  table: unknown;
  row: Record<string, unknown>;
}

/** Mock db đủ bề mặt repo dùng: transaction/insert().values().returning()/update/delete. */
class MockDb {
  committed: RowRec[] = [];
  private pending: RowRec[] = [];
  failOnOutboxInsert = false;
  transactionCalls = 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateResult: any[] = []; // rows trả về cho update().returning()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  deleteResult: any[] = []; // rows trả về cho delete().returning()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async transaction(cb: (tx: any) => Promise<any>): Promise<any> {
    this.transactionCalls++;
    this.pending = this.committed.map((rec) => ({ ...rec }));
    const tx = {
      insert: (table: unknown) => ({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        values: (v: any) => {
          const rows = (Array.isArray(v) ? v : [v]).map((r) => ({
            createdAt: new Date(),
            updatedAt: new Date(),
            ...r,
          }));
          const persist = async () => {
            // SEAM: fail giữa 2 step (task đã "ghi" working-copy, outbox chưa)
            if (table === outbox && this.failOnOutboxInsert) {
              throw new Error('seam: outbox insert failed');
            }
            const result = rows.map((r) => ({ ...r }));
            for (const r of result) this.pending.push({ table, row: r });
            return result;
          };
          const builder = { returning: persist } as { returning: typeof persist; then?: unknown };
          // insert().values() KHÔNG .returning() vẫn await được (drizzle thenable)
          builder.then = (
            resolve: (v: unknown) => unknown,
            reject: (e: unknown) => unknown,
          ) => persist().then(resolve, reject);
          return builder;
        },
      }),
      update: (_table: unknown) => ({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        set: (_v: any) => ({
          where: (_cond: unknown) => ({
            returning: async () => this.updateResult.map((r) => ({ ...r })),
          }),
        }),
      }),
      delete: (_table: unknown) => ({
        where: (_cond: unknown) => ({
          returning: async () => this.deleteResult.map((r) => ({ ...r })),
        }),
      }),
    };
    try {
      const result = await cb(tx);
      this.committed = this.pending; // COMMIT — chỉ khi toàn bộ callback xong
      return result;
    } catch (err) {
      // ROLLBACK — pending bị vứt, committed nguyên vẹn
      throw err;
    } finally {
      this.pending = [];
    }
  }
}

function makeRepo(db: MockDb): DrizzleTaskRepo {
  return new DrizzleTaskRepo(db as unknown as NodePgDatabase);
}

const EVENT = { type: 'task.created' as const, payload: { taskId: 't-1', userId: 'u-1', title: 'x', status: 'todo' } };

describe('DrizzleTaskRepo — mutation + outbox cùng 1 tx (conventions/09 rule 2)', () => {
  it('create: task + outbox ghi trong CÙNG 1 transaction callback', async () => {
    const db = new MockDb();
    const repo = makeRepo(db);
    const task = await repo.create(
      { id: 't-1', title: 'x', createdBy: 'u-1' },
      [EVENT],
    );
    expect(task.id).toBe('t-1');
    expect(db.transactionCalls).toBe(1); // 1 tx duy nhất cho cả 2 op
    expect(db.committed.filter((r) => r.table === tasks)).toHaveLength(1);
    expect(db.committed.filter((r) => r.table === outbox)).toHaveLength(1);
    const outboxRow = db.committed.find((r) => r.table === outbox)!.row;
    expect(outboxRow.type).toBe('task.created');
    expect(typeof outboxRow.id).toBe('string'); // envelope id do repo sinh
  });

  it('n events → n outbox row, mỗi event 1 envelope id riêng (task-events.md)', async () => {
    const db = new MockDb();
    const repo = makeRepo(db);
    await repo.create(
      { id: 't-1', title: 'x', createdBy: 'u-1' },
      [EVENT, { type: 'task.updated', payload: { taskId: 't-1', userId: 'u-1' } }],
    );
    const outboxRows = db.committed.filter((r) => r.table === outbox);
    expect(outboxRows).toHaveLength(2);
    expect(outboxRows[0].row.id).not.toBe(outboxRows[1].row.id);
  });

  it('SEAM ROLLBACK: outbox insert fail giữa 2 step → task + outbox cùng biến mất', async () => {
    const db = new MockDb();
    db.failOnOutboxInsert = true;
    const repo = makeRepo(db);
    await expect(repo.create({ id: 't-1', title: 'x', createdBy: 'u-1' }, [EVENT])).rejects.toThrow(
      'seam',
    );
    // rollback: committed rỗng — KHÔNG còn task row lẫn outbox row (acceptance)
    expect(db.committed).toHaveLength(0);
  });

  it('REGRESSION (review P0): update miss 0 row (404) → KHÔNG emit outbox event', async () => {
    const db = new MockDb();
    db.updateResult = []; // 0 row match — task không tồn tại
    const repo = makeRepo(db);
    const result = await repo.update('missing', { status: 'done' }, [
      { type: 'task.updated', payload: { taskId: 'missing', userId: 'u-1', status: 'done' } },
    ]);
    expect(result).toBeNull();
    expect(db.committed.filter((r) => r.table === outbox)).toHaveLength(0); // không phantom event
  });

  it('update hit → task + outbox emit trong cùng tx', async () => {
    const db = new MockDb();
    db.updateResult = [
      {
        id: 't-1',
        title: 'x',
        description: null,
        status: 'done',
        assigneeId: null,
        createdBy: 'u-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    const repo = makeRepo(db);
    const task = await repo.update('t-1', { status: 'done' }, [
      { type: 'task.updated', payload: { taskId: 't-1', userId: 'u-1', status: 'done' } },
    ]);
    expect(task?.status).toBe('done');
    expect(db.transactionCalls).toBe(1);
    expect(db.committed.filter((r) => r.table === outbox)).toHaveLength(1);
  });

  it('REGRESSION (review P0): delete miss 0 row → KHÔNG emit; delete hit → emit', async () => {
    const db = new MockDb();
    db.deleteResult = [];
    const repo = makeRepo(db);
    const miss = await repo.remove('missing', [
      { type: 'task.deleted', payload: { taskId: 'missing', userId: 'u-1' } },
    ]);
    expect(miss).toBe(false);
    expect(db.committed.filter((r) => r.table === outbox)).toHaveLength(0);

    db.deleteResult = [{ id: 't-1' }];
    const hit = await repo.remove('t-1', [
      { type: 'task.deleted', payload: { taskId: 't-1', userId: 'u-1' } },
    ]);
    expect(hit).toBe(true);
    expect(db.committed.filter((r) => r.table === outbox)).toHaveLength(1);
  });
});

// escapeLike — `q` khớp LITERAL trong ILIKE %q% (list search, tasks.yaml query param).
// `\` là escape char mặc định của Postgres LIKE/ILIKE — thoát cả chính nó.
describe('escapeLike — q literal, không wildcard', () => {
  it('escape đủ 3 ký tự `%` `_` `\\` — mỗi ký tự 1 backslash phía trước', () => {
    expect(escapeLike('50%')).toBe('50\\%');
    expect(escapeLike('a_b')).toBe('a\\_b');
    expect(escapeLike('a\\b')).toBe('a\\\\b');
    expect(escapeLike('%_\\')).toBe('\\%\\_\\\\');
  });

  it('ký tự thường không đụng vào — giữ nguyên (kể cả unicode)', () => {
    expect(escapeLike('báo cáo Q4')).toBe('báo cáo Q4');
    expect(escapeLike('')).toBe('');
  });
});
