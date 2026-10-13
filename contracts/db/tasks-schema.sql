-- ============================================================================
-- CANONICAL DDL — bảng `tasks` (schema `tasks`)
-- Epic FI-62 · SF-1 (FI-64) sở hữu. SF-2 (node-svc) và SF-4 (go-svc) ĐỌC file này:
--   - node-svc: migration PHẢI sinh ra cấu trúc KHỚP 1:1 với DDL này
--     (exit criterion SF-2: diff schema thực tế vs file này = 0)
--   - go-svc: stats query (`GROUP BY status`, COUNT) dựa trên đúng các cột ở đây
-- Thay đổi file này = phải đồng bộ contracts/openapi/tasks.yaml (Task schema).
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS tasks;

CREATE TABLE IF NOT EXISTS tasks.tasks (
    id            uuid PRIMARY KEY,
    title         varchar(200) NOT NULL,
    description   text,
    status        varchar(20)  NOT NULL DEFAULT 'todo'
                  CHECK (status IN ('todo', 'in_progress', 'done')),
    assignee_id   uuid,
    created_by    uuid NOT NULL,
    created_at    timestamptz  NOT NULL DEFAULT now(),
    updated_at    timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tasks_status      ON tasks.tasks (status);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON tasks.tasks (assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at  ON tasks.tasks (created_at DESC);

-- ----------------------------------------------------------------------------
-- Quyết định thiết kế (đừng "sửa giúp"):
--
-- 1. assignee_id / created_by KHÔNG có FK sang schema `users`:
--    users thuộc schema `users` do spring-svc (SF-3) sở hữu và migrate. FK chéo
--    schema tạo coupling migration giữa 2 service độc lập. Tính toàn vẹn
--    được đảm bảo ở mức ứng dụng: node-svc validate assignee qua REST
--    GET /api/users/{userId} (timeout 2s, fail-closed 503) trước khi ghi.
--
-- 2. status là varchar + CHECK constraint (không PG enum type): migration
--    đa công cụ (drizzle cho SF-2) sinh được 1:1, và CHECK là nguồn sự thật
--    mirror của enum TaskStatus trong contracts/openapi/tasks.yaml.
--
-- 3. id do ứng dụng sinh (uuid v4) — không dùng DEFAULT gen_random_uuid()
--    để migration của node-svc khớp DDL không cần extension pgcrypto.
--
-- 4. Grants: role `go_readonly` được SELECT qua ALTER DEFAULT PRIVILEGES
--    (platform/postgres/init/01-init.sh) — hiệu lực cho bảng do migration
--    node-svc tạo SAU script init này.
--
-- 5. APPLY CONTEXT (SF-7 note — học từ SF-4, improvements-log finding
--    "CREATE SCHEMA IF NOT EXISTS permission-denied"): dòng `CREATE SCHEMA`
--    ở đầu file cần **CREATE privilege trên DATABASE**, khác với phần table
--    DDL bên dưới chỉ cần CREATE **trên schema `tasks`**. Khi apply-as-role
--    (per-service DB role chỉ có grant schema-level):
--      - Chạy phần CREATE SCHEMA bằng owner/bootstrap role (hoặc bỏ qua nếu
--        schema đã tồn tại — CREATE SCHEMA IF NOT EXISTS vẫn denied với role
--        thiếu database-level CREATE, dù schema có sẵn);
--      - Chỉ chạy phần table + index bằng service role.
--    Compose path không bị ảnh hưởng (init script chạy bằng superuser).
-- ----------------------------------------------------------------------------
