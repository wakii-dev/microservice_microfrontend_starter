// repo.drizzle.ts — drizzle-orm implementation của TaskRepo (schema `tasks`,
// canonical DDL contracts/db/tasks-schema.sql). Bảng do migration tạo (role
// node_svc, search_path=tasks set bởi 01-init.sh).
//
// SF-2 (FI-79): mutation + INSERT outbox trong CÙNG 1 tx (db.transaction —
// conventions/09 rule 2). Thứ tự trong tx: task mutation TRƯỚC, outbox SAU —
// fail ở bước nào cũng rollback cả 2 (test: repo.drizzle.test.ts seam).
import { and, count, desc, eq, ilike, ne, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { outbox, tasks } from './db/schema.js';
import type {
  ListFilter,
  OutboxEventInput,
  Task,
  TaskCreate,
  TaskPatch,
  TaskRepo,
  TaskStatusExtended,
} from './repo.js';

type Row = typeof tasks.$inferSelect;
type Tx = Parameters<Parameters<NodePgDatabase['transaction']>[0]>[0];

/**
 * Escape ký tự wildcard của LIKE (`%` `_` và chính `\`) — `q` khớp LITERAL trong
 * title, không phải pattern. `\` là escape char mặc định của Postgres LIKE/ILIKE.
 */
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (ch) => `\\${ch}`);
}

function toTask(row: Row): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status as TaskStatusExtended,
    assigneeId: row.assigneeId,
    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export class DrizzleTaskRepo implements TaskRepo {
  constructor(private readonly db: NodePgDatabase) {}

  async ping(): Promise<void> {
    await this.db.execute(sql`select 1`);
  }

  async list(filter: ListFilter): Promise<{ items: Task[]; total: number }> {
    const conditions = [
      filter.status ? eq(tasks.status, filter.status) : undefined,
      filter.assigneeId ? eq(tasks.assigneeId, filter.assigneeId) : undefined,
      filter.q ? ilike(tasks.title, `%${escapeLike(filter.q)}%`) : undefined,
    ].filter(Boolean);

    const rows = await this.db
      .select()
      .from(tasks)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(tasks.createdAt))
      .limit(filter.limit)
      .offset(filter.offset);

    const [{ value: total }] = await this.db
      .select({ value: count() })
      .from(tasks)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return { items: rows.map(toTask), total };
  }

  async getById(id: string): Promise<Task | null> {
    const [row] = await this.db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
    return row ? toTask(row) : null;
  }

  async create(input: TaskCreate, events: OutboxEventInput[]): Promise<Task> {
    return this.mutateWithOutbox(events, async (tx, emit) => {
      const [row] = await tx
        .insert(tasks)
        .values({
          id: input.id ?? crypto.randomUUID(),
          title: input.title,
          description: input.description ?? null,
          status: 'todo',
          assigneeId: input.assigneeId ?? null,
          createdBy: input.createdBy,
        })
        .returning();
      await emit(); // create luôn affected ≥1 — insert thành công là có row
      return toTask(row);
    });
  }

  async update(id: string, patch: TaskPatch, events: OutboxEventInput[]): Promise<Task | null> {
    return this.mutateWithOutbox(events, async (tx, emit) => {
      const values: Partial<Row> = { updatedAt: new Date() };
      if (patch.title !== undefined) values.title = patch.title;
      if (patch.description !== undefined) values.description = patch.description;
      if (patch.status !== undefined) values.status = patch.status;
      if (patch.assigneeId !== undefined) values.assigneeId = patch.assigneeId;

      const [row] = await tx
        .update(tasks)
        .set(values)
        .where(eq(tasks.id, id))
        .returning();
      // Gate theo row-affected: 0 row (404) KHÔNG emit event — tránh phantom
      // event cho task không tồn tại (review P0 FI-79).
      if (row) await emit();
      return row ? toTask(row) : null;
    });
  }

  async remove(id: string, events: OutboxEventInput[]): Promise<boolean> {
    return this.mutateWithOutbox(events, async (tx, emit) => {
      const deleted = await tx
        .delete(tasks)
        .where(eq(tasks.id, id))
        .returning();
      if (deleted.length > 0) await emit(); // 0 row (404) → không emit
      return deleted.length > 0;
    });
  }

  async markAssignmentFailed(taskId: string, assigneeId: string): Promise<boolean> {
    // CONDITIONAL guard (ADR-0008 — bắt buộc): chỉ đổi khi assignee khớp event
    // (chống stale compensation — event cũ cho assignee cũ phải bỏ qua) VÀ
    // chưa ở 'assignment_failed' (idempotent — event lặp match 0 row).
    const updated = await this.db
      .update(tasks)
      .set({ status: 'assignment_failed', updatedAt: new Date() })
      .where(
        and(eq(tasks.id, taskId), eq(tasks.assigneeId, assigneeId), ne(tasks.status, 'assignment_failed')),
      )
      .returning();
    return updated.length > 0;
  }

  /**
   * mutation + outbox trong CÙNG tx; envelope id sinh tại đây, MỖI event 1 id.
   * `emit` do mutation tự gọi SAU khi biết row-affected — 0 row (PATCH/DELETE
   * trúng 404) KHÔNG emit → không có phantom event cho task không tồn tại.
   */
  private mutateWithOutbox<T>(
    events: OutboxEventInput[],
    mutate: (tx: Tx, emit: () => Promise<void>) => Promise<T>,
  ): Promise<T> {
    return this.db.transaction(async (tx) => {
      const emit = async (): Promise<void> => {
        if (events.length > 0) {
          await tx.insert(outbox).values(
            events.map((event) => ({
              id: crypto.randomUUID(),
              type: event.type,
              payload: event.payload,
            })),
          );
        }
      };
      return mutate(tx, emit);
    });
  }
}
