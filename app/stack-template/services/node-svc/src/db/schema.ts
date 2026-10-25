// schema.ts — drizzle definition của bảng `tasks`.
// NGUỒN SỰ THẬT cấu trúc: contracts/db/tasks-schema.sql (canonical DDL, SF-1).
// Bất kỳ lệch nào giữa schema này và DDL → schema-diff.test.ts FAIL.
// Đúng các design decisions trong DDL comment: id app-generated (không
// gen_random_uuid), status varchar + CHECK (không PG enum), không FK chéo schema.
import { sql } from 'drizzle-orm';
import {
  check,
  index,
  jsonb,
  pgSchema,
  timestamp,
  uuid,
  varchar,
  text,
} from 'drizzle-orm/pg-core';

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
    // 'assignment_failed' chỉ compensation consumer ghi — API PATCH không nhận
    // (TaskStatus writable 3 giá trị, TaskStatusExtended response 4 — tasks.yaml).
    check(
      'status_check',
      sql`${t.status} IN ('todo', 'in_progress', 'done', 'assignment_failed')`,
    ),
    index('idx_tasks_status').on(t.status),
    index('idx_tasks_assignee_id').on(t.assigneeId),
    index('idx_tasks_created_at').on(t.createdAt.desc()),
  ],
);

export type TaskRow = typeof tasks.$inferSelect;
export type NewTaskRow = typeof tasks.$inferInsert;

// outbox — transactional outbox (ADR-0008, conventions/09 rule 2): mutation task
// + INSERT outbox trong CÙNG 1 tx; relay poll publish rồi mark published_at.
// KHÔNG vào canonical DDL contracts/db/tasks-schema.sql — node-internal infra
// (schema-diff.test whitelist riêng, không so với canonical).
// id = envelope UUIDv4 do node sinh (khóa idempotency của consumer — task-events.md).
// published_at NULL = chưa publish; relay publish TRƯỚC mark (crash giữa chừng
// = duplicate → at-least-once, consumer dedupe). Purge: published cũ > 7 ngày.
export const outbox = tasksSchema.table('outbox', {
  id: uuid('id').primaryKey(),
  type: varchar('type', { length: 40 }).notNull(),
  payload: jsonb('payload').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  publishedAt: timestamp('published_at', { withTimezone: true }),
});

export type OutboxRow = typeof outbox.$inferSelect;
export type NewOutboxRow = typeof outbox.$inferInsert;
