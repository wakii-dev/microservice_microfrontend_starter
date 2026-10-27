#!/bin/bash
# ============================================================================
# Postgres init — chạy MỘT LẦN trên volume mới (docker-entrypoint-initdb.d).
# Tạo: 5 schemas (tasks/users/activity/auth/notifications) + 1 LOGIN role per
# service + 1 readonly role cho go-svc đọc schema `tasks`.
#
# ĐIỂM MÚT: ALTER DEFAULT PRIVILEGES FOR ROLE node_svc — grant SELECT hiệu lực
# cho BẢNG SINH SAU bởi migration của node-svc (SF-2). Không có default
# privileges thì go_readonly không thấy bảng mới → stats 503.
# ============================================================================
set -euo pipefail

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<EOSQL
-- Schemas — mỗi service 1 schema (multi-repo convention trong 1 DB)
CREATE SCHEMA IF NOT EXISTS tasks;
CREATE SCHEMA IF NOT EXISTS users;
CREATE SCHEMA IF NOT EXISTS activity;
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS notifications;

-- LOGIN role per service — mỗi service chỉ đụng schema của mình
-- Ràng buộc (P2 security-audit SF-5): password KHÔNG chứa dấu nháy đơn (')
-- — bash interpolate rồi bọc single-quote trong SQL; giá trị sai cú pháp làm
-- init fail-closed (ON_ERROR_STOP) chứ không bypass. Upgrade path: psql -v
-- binding (:'var') cho cả 5 role — follow-up, không phải instance mới alone.
CREATE ROLE node_svc   LOGIN PASSWORD '${NODE_SVC_DB_PASSWORD}';
CREATE ROLE spring_svc LOGIN PASSWORD '${SPRING_SVC_DB_PASSWORD}';
CREATE ROLE go_svc     LOGIN PASSWORD '${GO_SVC_DB_PASSWORD}';
CREATE ROLE auth_svc   LOGIN PASSWORD '${AUTH_SVC_DB_PASSWORD}';
CREATE ROLE dotnet_svc LOGIN PASSWORD '${DOTNET_SVC_DB_PASSWORD}';

-- readonly role — go-svc đọc stats từ schema tasks (canonical DDL của SF-1)
CREATE ROLE go_readonly LOGIN PASSWORD '${GO_READONLY_DB_PASSWORD}';

-- Owners + quyền schema
GRANT USAGE, CREATE ON SCHEMA tasks    TO node_svc;
GRANT USAGE, CREATE ON SCHEMA users    TO spring_svc;
GRANT USAGE, CREATE ON SCHEMA activity TO go_svc;
GRANT USAGE, CREATE ON SCHEMA auth     TO auth_svc;
GRANT USAGE, CREATE ON SCHEMA notifications TO dotnet_svc;
ALTER ROLE node_svc   SET search_path = tasks;
ALTER ROLE spring_svc SET search_path = users;
ALTER ROLE go_svc     SET search_path = activity;
ALTER ROLE auth_svc   SET search_path = auth;
ALTER ROLE dotnet_svc SET search_path = notifications;

-- Readonly read path
GRANT USAGE ON SCHEMA tasks TO go_readonly;

-- ⚠️ Default privileges: grant áp dụng cho bảng tạo SAU này bởi owner role.
-- (FOR ROLE node_svc = bảng do migration node-svc tạo ra.)
ALTER DEFAULT PRIVILEGES FOR ROLE node_svc IN SCHEMA tasks
  GRANT SELECT ON TABLES TO go_readonly;

-- go-svc đọc display fields từ users schema? KHÔNG — userName resolve qua
-- spring-svc (contract activity.yaml), go_readonly CHỈ được schema tasks.
EOSQL

echo "[init] schemas + roles + default privileges created OK"
