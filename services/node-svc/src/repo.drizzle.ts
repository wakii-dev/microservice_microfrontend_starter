// repo.drizzle.ts — drizzle-orm implementation của TaskRepo (schema `tasks`,
// canonical DDL contracts/db/tasks-schema.sql). Bảng do migration tạo (role
// node_svc, search_path=tasks set bởi 01-init.sh).
import { and, count, desc, eq, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { tasks } from './db/schema.js';
import type {
  ListFilter,
  Task,
  TaskCreate,
  TaskPatch,
  TaskRepo,
  TaskStatus,
} from './repo.js';

type Row = typeof tasks.$inferSelect;

function toTask(row: Row): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status as TaskStatus,
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

  async create(input: TaskCreate): Promise<Task> {
    const [row] = await this.db
      .insert(tasks)
      .values({
        id: crypto.randomUUID(),
        title: input.title,
        description: input.description ?? null,
        status: 'todo',
        assigneeId: input.assigneeId ?? null,
        createdBy: input.createdBy,
      })
      .returning();
    return toTask(row);
  }

  async update(id: string, patch: TaskPatch): Promise<Task | null> {
    const values: Partial<Row> = { updatedAt: new Date() };
    if (patch.title !== undefined) values.title = patch.title;
    if (patch.description !== undefined) values.description = patch.description;
    if (patch.status !== undefined) values.status = patch.status;
    if (patch.assigneeId !== undefined) values.assigneeId = patch.assigneeId;

    const [row] = await this.db.update(tasks).set(values).where(eq(tasks.id, id)).returning();
    return row ? toTask(row) : null;
  }

  async remove(id: string): Promise<boolean> {
    const deleted = await this.db.delete(tasks).where(eq(tasks.id, id)).returning();
    return deleted.length > 0;
  }
}
