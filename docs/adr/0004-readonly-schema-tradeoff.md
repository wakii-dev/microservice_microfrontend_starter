# ADR 0004 — Per-service Postgres schema + readonly role cho go-svc

Ngày: 2026-10-12 · Status: Accepted

## Context
Mỗi service sở hữu dữ liệu riêng (database-per-service pattern) nhưng go-svc cần thống kê từ tasks (schema của node-svc). Chọn giữa: share table, duplicate data qua API, hay read trực tiếp.

## Decision
1 DB Postgres, mỗi service 1 schema, migrate độc lập. go-svc ĐỌC-ONLY schema `tasks` qua role `go_readonly` (SELECT-only); grants cấp bằng `ALTER DEFAULT PRIVILEGES IN SCHEMA tasks` từ init script — vẫn hiệu lực cho bảng do migration node-svc tạo SAU init. go-svc TỰ migrate schema `activity` của mình.

## Consequences
- (+) Stats query trực tiếp, không double-write, không coupling migration chéo-schema (không FK qua schema — xem canonical DDL comment #1).
- (−) Trade-off thật: go-svc phụ thuộc hình dạng schema tasks — được khoá bằng canonical DDL (ADR 0003).
- (−) DB role phức tạp hơn (per-service role + readonly role). Gotcha đã học: `CREATE SCHEMA` cần CREATE trên DATABASE (khác CREATE trên schema) — apply-as-role phải tách phần CREATE SCHEMA (note trong `contracts/db/tasks-schema.sql` #5); drizzle migrator luôn phát CREATE SCHEMA — node-svc custom runner skip khi to_regnamespace tồn tại.
