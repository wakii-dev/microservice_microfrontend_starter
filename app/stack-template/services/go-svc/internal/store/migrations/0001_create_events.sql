-- 0001 — bảng activity.events (go-svc SF-4 sở hữu schema `activity`).
-- id do app sinh (uuid v4) — cùng quyết định canonical DDL của tasks
-- (contracts/db/tasks-schema.sql quyết định 3): không phụ thuộc pgcrypto.
-- user_name / task_title: display fields resolve best-effort lúc ingest
-- (spring REST / readonly tasks) — contract activity.yaml yêu cầu feed trả đủ.

CREATE TABLE IF NOT EXISTS activity.events (
    id         uuid PRIMARY KEY,
    task_id    uuid        NOT NULL,
    user_id    uuid        NOT NULL,
    action     varchar(20) NOT NULL
               CHECK (action IN ('task.created', 'task.updated', 'task.deleted')),
    event_ts   timestamptz NOT NULL,
    user_name  varchar(200) NOT NULL DEFAULT '',
    task_title varchar(200) NOT NULL DEFAULT '',
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_events_event_ts ON activity.events (event_ts DESC);
CREATE INDEX IF NOT EXISTS idx_activity_events_task_id  ON activity.events (task_id);
