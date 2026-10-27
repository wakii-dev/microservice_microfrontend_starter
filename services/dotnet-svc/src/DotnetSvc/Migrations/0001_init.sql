-- Migration 0001 — 1:1 mirror of the table + index portion of the canonical DDL
-- contracts/db/notifications-schema.sql (WITHOUT the CREATE SCHEMA line —
-- the schema comes from platform/postgres/init/01-init.sh; the dotnet_svc role
-- only has CREATE on the schema — APPLY CONTEXT in the DDL). Change one,
-- change both, same commit.

CREATE TABLE IF NOT EXISTS notifications.notifications (
    id         uuid PRIMARY KEY,
    user_id    uuid NOT NULL,
    title      varchar(200) NOT NULL,
    body       text,
    read       boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id    ON notifications.notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications.notifications (created_at DESC);
