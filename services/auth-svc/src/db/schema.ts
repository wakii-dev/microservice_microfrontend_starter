// schema.ts — drizzle definition của schema `auth` (epic VU-59 — auth-svc owns
// schema riêng, spec §Kiến trúc). 2 bảng: users (seed từ contracts/auth/users.json
// GIỮ UUID) + refresh_tokens (opaque rotation CAS — token-contract.md §2–3).
// KHÔNG có canonical DDL trong contracts/db (schema này thuộc auth-svc, khác
// tasks-schema.sql của node-svc) — cấu trúc định nghĩa tại đây + migration 0000.
import { sql } from 'drizzle-orm';
import { index, pgSchema, text, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';

export const authSchema = pgSchema('auth');

export const users = authSchema.table('users', {
  id: uuid('id').primaryKey(), // seeded users giữ nguyên UUID fixture users.json
  // lowercase-normalized ở tầng route TRƯỚC lưu/lookup — unique chặn race 409
  email: varchar('email', { length: 255 }).notNull(),
  displayName: text('display_name').notNull(),
  // roles: nguồn sự thật khi sign JWT — mirror token claims (token-contract §1)
  roles: text('roles').array().notNull().default(sql`'{"user"}'::text[]`),
  passwordHash: text('password_hash').notNull(), // argon2id — KHÔNG bao giờ ra response
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex('users_email_unique').on(t.email)]);

export const refreshTokens = authSchema.table('refresh_tokens', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  // sha256 hex của raw token — lookup key + CAS target; DB KHÔNG có raw
  tokenHash: varchar('token_hash', { length: 64 }).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(), // now + 7d
  revokedAt: timestamp('revoked_at', { withTimezone: true }), // NULL = còn sống
  replacedBy: uuid('replaced_by'), // rotation: trỏ id token mới (không FK — token mới có thể đã bị purge)
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('refresh_tokens_token_hash_unique').on(t.tokenHash),
  index('idx_refresh_tokens_user_id').on(t.userId),
]);

export type UserRow = typeof users.$inferSelect;
export type NewUserRow = typeof users.$inferInsert;
export type RefreshTokenRow = typeof refreshTokens.$inferSelect;
export type NewRefreshTokenRow = typeof refreshTokens.$inferInsert;
