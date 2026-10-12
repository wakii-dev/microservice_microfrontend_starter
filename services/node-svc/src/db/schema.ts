// schema.ts — drizzle definition của bảng `tasks`.
// NGUỒN SỰ THẬT cấu trúc: contracts/db/tasks-schema.sql (canonical DDL, SF-1).
// Bất kỳ lệch nào giữa schema này và DDL → schema-diff.test.ts FAIL.
// Đúng các design decisions trong DDL comment: id app-generated (không
// gen_random_uuid), status varchar + CHECK (không PG enum), không FK chéo schema.
import { sql } from 'drizzle-orm';
import { check, index, pgSchema, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';

export const tasksSchema = pgSchema('tasks');

export const tasks = tasksSchema.table(
  'tasks',
  {
    id: uuid('id').primaryKey(),
    title: varchar('title', { length: 200 }).notNull(),
    description: text('description'),
    status: varchar('status', { length: 20 }).notNull().default('todo'),
    assigneeId: uuid('assignee_id'),
    createdBy: uuid('created_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check('status_check', sql`${t.status} IN ('todo', 'in_progress', 'done')`),
    index('idx_tasks_status').on(t.status),
    index('idx_tasks_assignee_id').on(t.assigneeId),
    index('idx_tasks_created_at').on(t.createdAt.desc()),
  ],
);

export type TaskRow = typeof tasks.$inferSelect;
export type NewTaskRow = typeof tasks.$inferInsert;
