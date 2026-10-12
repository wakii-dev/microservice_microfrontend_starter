-- ============================================================================
-- V1 — schema `users` DDL (spring-svc SF-3 sở hữu)
-- Schema `users` + role spring_svc (search_path=users) do
-- platform/postgres/init/01-init.sh tạo — file này KHÔNG tạo schema.
-- ddl-auto: none — Flyway là schema owner duy nhất.
-- ============================================================================

CREATE TABLE users (
    id           uuid PRIMARY KEY,
    email        varchar(255) NOT NULL UNIQUE,
    display_name varchar(255) NOT NULL,
    roles        text[]       NOT NULL
);

CREATE TABLE teams (
    id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(255) NOT NULL
);

CREATE TABLE team_members (
    team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id uuid NOT NULL,
    PRIMARY KEY (team_id, user_id)
);
