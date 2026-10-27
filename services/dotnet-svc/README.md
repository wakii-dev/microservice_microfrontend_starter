# dotnet-svc — notifications API (ASP.NET Core 8 Minimal API)

The .NET service of the boilerplate — the **4th language** ([ADR-0011](../../docs/adr/0011-dotnet-4th-language.md)): single-table notifications CRUD for the current user (JWT sub), PostgreSQL via **Npgsql + Dapper** (kept thin, no EF Core). Owns schema `notifications` (self-migrating at boot). NO Kafka, NO inter-service calls — fully decoupled from tasks/users/activity/auth.

## API surface

Contract source of truth: [`contracts/openapi/dotnet.yaml`](../../contracts/openapi/dotnet.yaml).

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/healthz` | no | Liveness — `{"status":"ok"}` (naked path, compose/CI probe) |
| GET | `/readyz` | no | Readiness — migration `notifications` done + real table check (`to_regclass`); fail → `503` envelope |
| GET | `/api/dotnet/healthz`, `/api/dotnet/readyz` | no | Mirror under the prefix (conventions/02 rule 6) |
| GET | `/api/dotnet/notifications` | JWT | Current user's list, newest first + `total`; `?limit=20&offset=0` |
| POST | `/api/dotnet/notifications` | JWT | Create (`title` 1–200 required, optional `body` ≤5000) → `201` |
| GET | `/api/dotnet/notifications/{id}` | JWT | Read one — `404` when missing/owned by another user |
| PATCH | `/api/dotnet/notifications/{id}` | JWT | `{read: bool}` — mark read/unread |
| DELETE | `/api/dotnet/notifications/{id}` | JWT | Delete → `204` |

Through the nginx gateway (`:8080/api/dotnet/*`): gateway presence-checks the JWT (401 when missing). The service **verifies itself** — signature (HS256 + `JWT_SECRET`) + expiry + `iss=auth-mock` (2-layer enforcement, token-contract.md §4); invalid/expired → `401` envelope `UNAUTHORIZED`.

## Run via Docker (recommended — no .NET SDK needed on dev machines)

```bash
cd platform && cp -n .env.example .env   # fill JWT_SECRET + passwords
docker compose --env-file .env up -d --build postgres auth-svc dotnet-svc
curl -s http://localhost:8083/readyz     # {"status":"ok"} = migration done
```

Building the image **runs the unit tests inside the build stage** (xunit) — `docker build services/dotnet-svc` = test + build in one shot.

## Run natively (dev machine WITH .NET SDK 8)

Needs Postgres 16 with schema + role pre-created (`platform/postgres/init/01-init.sh`):

```bash
cd services/dotnet-svc/src/DotnetSvc
export DOTNET_SVC_PORT=8083
export DATABASE_URL='postgres://dotnet_svc:<DOTNET_SVC_DB_PASSWORD>@localhost:5432/boilerplate'
export JWT_SECRET='<openssl rand -base64 48>'
export CORS_DEV_ORIGIN='http://localhost:3000,http://localhost:4001,http://localhost:4002'
export LOG_LEVEL=info
dotnet run
```

Required env: `DATABASE_URL`, `JWT_SECRET` — missing → fail-fast at boot (conventions/06 rule 6). Full inventory in [`platform/.env.example`](../../platform/.env.example).

## Tests

```bash
# via Docker (no SDK needed):
docker build -t dotnet-svc:local services/dotnet-svc          # xunit runs in the build stage
# with a local SDK:
dotnet test services/dotnet-svc/tests/DotnetSvc.Tests/DotnetSvc.Tests.csproj
```

Unit (no DB): error envelope shape (conventions/04 + FE `decodeErrorEnvelope`), validator rules per spec, JSON log shape (conventions/03), embedded migration resource, `postgres://` URL → Npgsql keyword conversion. CI: [`.github/workflows/services-dotnet-svc.yml`](../../.github/workflows/services-dotnet-svc.yml) — 3 jobs (build-test, docker-build, boot-smoke with a real CRUD flow via alice's JWT).

## Implementation notes (intentional deviations from conventions/01)

- **wget installed in the runtime stage** (`apt-get install wget`): the aspnet bookworm-slim image ships no wget/curl — the compose healthcheck probes `/readyz` (conventions/02) and needs it; the node/go base images get busybox/distroless for free.
- **Migration as embedded resource** `src/DotnetSvc/Migrations/0001_init.sql` — 1:1 mirror of the table + index portion of the canonical DDL [`contracts/db/notifications-schema.sql`](../../contracts/db/notifications-schema.sql) (WITHOUT the `CREATE SCHEMA` line — the schema belongs to the init script running as superuser; the service role only has CREATE on the schema — APPLY CONTEXT in the DDL). Change one, change both, same commit.
- **`read` as a column name**: a NON-RESERVED PostgreSQL keyword — valid unquoted, 1:1 with field `read` in the spec.
- **`DATABASE_URL` stays in the shared `postgres://` URL form** (same env shape as every other service); Npgsql only accepts keyword connection strings, so `NotificationStore.ToNpgsqlConnectionString` converts it (unit-tested).
- JSON logs: a custom `ConsoleFormatter` (`WakiiJsonConsoleFormatter`) — the conventions/03 ts/level/service/msg shape preserved across stacks; ASP.NET hosting scope fields (TraceId/SpanId/ConnectionId) appear as extra fields, which conventions/03 permits ("rest: free-form").
