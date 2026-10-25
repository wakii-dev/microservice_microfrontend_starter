# Plan: SF-4 go-svc — activity API (Go 1.24 + chi)
Date: 2026-10-12 | Linear: FI-72 | Worktree: sf-4-go-svc (branch `__STACK_ORG__/sf-4-go-svc`)
Spec: epic `docs/superpowers/specs/2026-10-12-boilerplate-microservice-mfe.md` rev 3 §SF-4 + context pack `docs/superpowers/contexts/sf-4.md`
> Rev 2 — sau plan-critic (FIX-P0-FIRST): P0-1 boot-smoke apply canonical DDL bằng role node_svc + negative readyz check; P0-2 compose pre-seed DATABASE_URL sai credentials (platform defect SF-1 — FLAG, không tự sửa; CI dùng override file do SF-4 sở hữu). P1: DAG edge T5←T4; swagger docs auth-exempt + curl boot-smoke; schemathesis kèm JWT (login auth-mock); CI build-test từ T1 (compile feedback sớm); go.sum strategy.

## 0. Root cause analysis (WHY)

### Root cause
Epic acceptance #3 ("activity phản ánh task vừa tạo") chưa có service nào sở hữu activity: node-svc mutate task nhưng không nơi nào ghi nhận event, và stats phải đọc data do service KHÁC sở hữu (schema `tasks` của node-svc) — cần chứng minh multi-repo convention hoạt động xuyên DB permission boundary (readonly role).

### Current state (before feature)
`services/go-svc/` chỉ có README placeholder. Compose entry `go-svc` đã pre-seed (SF-1) — build fail đến khi có code. Postgres init đã tạo sẵn schema `activity` + role `go_svc` (owner) + `go_readonly` (SELECT qua ALTER DEFAULT PRIVILEGES FOR ROLE node_svc).

### Expected outcome
POST /activity/events nhận event fire-and-forget từ node-svc → feed hiển thị kèm user-display fields (userName, taskTitle) → stats phản ánh đúng rows `tasks` (seed bằng owner role). CI xanh: build + test + docker build + boot-smoke.

### Constraints & hardships
- Dev machine KHÔNG Docker, KHÔNG Go toolchain → mọi verify (go test, docker build, boot-smoke) qua CI.
- KHÔNG sửa compose/contracts/conventions; KHÔNG migrate schema `tasks`; KHÔNG message broker.
- go_readonly CHỈ có SELECT schema `tasks` — userName phải resolve qua spring-svc REST (init script chốt).
- ALTER DEFAULT PRIVILEGES chỉ hiệu lực cho bảng do `node_svc` tạo → test seed phải chạy DDL bằng role `node_svc`, không phải superuser.

### High-level strategy
Single Go module `services/go-svc`, chi router, layering: `cmd/server` → `internal/{config,logging,auth,store,api}`. Migration SQL embedded, chạy lúc boot. Test strategy: unit (httptest, không DB) local-nếu-có / chắc chắn CI; integration (đụng Postgres) chạy trong CI job với postgres service container; contract (schemathesis) trong boot-smoke job. Execute inline (Go tests chỉ CI-bound — dispatch subagent không thêm khả năng verify), review rolling theo nhóm.

## 1. Problem (intent)
Dev copy boilerplate cần service Go mẫu hoàn chỉnh: nhận event, serve feed/stats đúng contract `contracts/openapi/activity.yaml`, tự verify JWT, chứng minh readonly-read hoạt động — không phải tự nghĩ lại từ đầu.

## 2. Scope
- **In scope**: scaffold go-svc; feed/stats/events endpoints; migration schema `activity`; JWT verify; healthcheck; slog JSON; error envelope; CORS dev; tests (unit + integration readonly-exit + contract); Dockerfile multi-stage distroless; boot-smoke CI job; swagger-ui static serve spec; README standalone.
- **Out of scope**: node/spring/FE impl; schema `tasks` migration; compose/contracts/conventions sửa; message broker; k8s; UI thật (SF-6).
- **Success criteria (observable, từ context pack ACCEPTANCE)**:
  1. Swagger-ui go-svc mở được; POST event → event hiện trong feed.
  2. Stats đúng rows seeded bằng owner role `node_svc` (canonical DDL).
  3. Negative: không có readonly grant → query tasks fail rõ ràng (503 `DEPENDENCY_DOWN` envelope).
  4. Token sai/hết hạn → 401 từ go-svc (không phụ thuộc gateway).
  5. CI xanh: build-test (go vet + unit + integration với postgres) + docker-build + boot-smoke (up + health + migration xong + schemathesis).

## 3. Touch map
- **Modify/create**: `services/go-svc/**` (SỞ HỮU — module, cmd, internal, test, Dockerfile, README); `.github/workflows/services-go-svc.yml` (tạo từ template); `docs/superpowers/evidence/sf-4-go-svc/test-run.txt`.
- **Consumers/regression**: node-svc (SF-2 — POST /events contract), FE remote activity (SF-6 — feed/stats shape), SF-7 smoke.
- **Shared surfaces (READ-ONLY)**: `contracts/openapi/activity.yaml`, `contracts/db/tasks-schema.sql`, `platform/docker-compose.yml` (entry pre-seed env: PORT, DATABASE_URL, DATABASE_READONLY_URL, JWT_SECRET, SPRING_SVC_URL, CORS_DEV_ORIGIN, LOG_LEVEL), `platform/conventions/*`, `platform/postgres/init/01-init.sh`.

## 4. Design
- **Approach A (chọn)**: swagger-ui-dist vendored + `go:embed` + bản copy spec `internal/api/openapi/activity.yaml` (sync-check test). Offline hoàn toàn, distroless-compatible. Alternative B (CDN html) dismissed: phụ thuộc internet lúc demo, lệch "static serve".
- **userName resolution**: resolve lúc ingest + lúc đọc, best-effort: spring-svc `GET /api/users/{userId}` (display name), timeout ngắn (2s), cache in-memory TTL; khi spring down → trả `""` (degraded trung thực, không bịa placeholder — ADR ghi README). taskTitle: `SELECT title FROM tasks.tasks WHERE id=$1` bằng readonly connection; bảng chưa có → `""`.
- **Stats**: 2 query readonly: `COUNT(*)` + `GROUP BY status` trên `tasks.tasks`; `recentEvents` = COUNT events 24h qua (schema activity, owner conn). tasks unreadable (permission/bảng chưa có) → 503 `DEPENDENCY_DOWN` envelope.
- **JWT**: `golang-jwt/jwt/v5`, HS256, verify signature + `exp` + `iss=auth-mock`; fail → 401 `UNAUTHORIZED` envelope.
- **Migration**: embedded SQL (`schema activity` đã có từ init — migration tạo `activity.events`: id uuid app-generated, task_id, user_id, action CHECK enum, event_ts timestamptz, user_name, task_title, created_at). Idempotent runner (migrations table + applied tracking).
- **Fire-and-forget ingest**: validate payload theo ActivityEventInput (uuid, action enum 3 giá trị, RFC3339 timestamp) → persist inline → 202 `{"accepted":true}`. node-side không retry là trách nhiệm node-svc.
- **Edge cases**: event trùng (re-push) → chấp nhận (idempotent-friendly: không dedupe — node không retry nên trùng hiếm; log info); limit clamp 1..100; offset ≥0; spring timeout; tasks table missing; readyz = migration xong + SELECT probe tasks (fail → 503).
- **Non-functional**: port 8082 env `PORT`; healthcheck naked `/healthz`+`/readyz` ngoài prefix `/api/activity`; request slog JSON (ts/level/service/msg/requestId); requestId từ `X-Request-Id`; CORS `rs/cors` đọc `CORS_DEV_ORIGIN` (rỗng = deny-by-default); non-root distroless.

## 5. Implementation outline

### Tasks (ordered — DAG)
| # | Task | Deps |
|---|------|------|
| T1 | Scaffold: go.mod 1.24 (chi v5.3.2, golang-jwt v5.3.1, rs/cors), cmd/server, internal/config (env fail-fast), slog JSON logging, chi router (prefix `/api/activity` + naked health), requestId + error-envelope + CORS middleware, `/healthz`, Dockerfile distroless (conventions/01; `COPY go.mod go.sum*` + `go mod download` tự sinh go.sum in-image — dev không có Go), **+ CI workflow tối thiểu (build-test: setup-go + vet + test) cho compile feedback ngay từ commit đầu** | — |
| T2 | JWT middleware (golang-jwt/jwt/v5 HS256: sig+exp+iss) + 401 envelope + unit tests (missing/bad-sig/expired/wrong-iss/valid) | T1 |
| T3 | Embedded migration runner + `activity.events` table (app uuid v4, CHECK action enum) + `/readyz` (migration xong + readonly SELECT probe tasks → 503 envelope khi fail) + unit tests | T1 |
| T4 | POST `/events`: validation theo activity.yaml + persist + 202 EventAccepted; display-field resolver (spring REST client timeout 2s + cache TTL; taskTitle readonly lookup) + unit tests (httptest fake spring) | T2, T3 |
| T5 | GET `/feed` (limit/offset clamp, mới nhất trước, total) + GET `/stats` (COUNT + GROUP BY status readonly + recentEvents 24h; 503 DEPENDENCY_DOWN khi tasks unreadable) + repository layer + unit tests — **tiêu thụ resolver interface từ T4** | T3, T4 |
| T6 | Swagger-ui: vendored swagger-ui-dist (go:embed, Apache-2.0 license note) + spec copy `internal/api/openapi/activity.yaml` + sync-check test vs contracts + serve `/api/activity/docs` + `/api/activity/openapi.yaml` — **auth-exempt (tiền lệ auth-mock `/api/auth/docs` mở)** | T1 |
| T7 | Integration tests (CI postgres service): readonly-exit criterion — apply canonical DDL + seed bằng role `node_svc` → stats đúng (assert `tableowner='node_svc'`); REVOKE SELECT → 503 → re-grant; POST event → feed chứa event; 401 paths | T4, T5 |
| T8 | CI workflow `.github/workflows/services-go-svc.yml`: build-test (setup-go 1.24 + postgres service + go vet/test), docker-build, boot-smoke — **(P0-1) apply `contracts/db/tasks-schema.sql` bằng role `node_svc` (`docker compose exec -T postgres psql -U node_svc`) + seed trước khi boot go-svc; negative check: boot trước DDL → readyz 503 (chứng minh probe thật) → apply DDL → readyz 200**; **(P0-2) dùng compose override file `services/go-svc/ci.compose.override.yml` (SF-4 sở hữu) sửa DATABASE_URL=`go_svc:` / DATABASE_READONLY_URL=`go_readonly:` — KHÔNG đụng platform/docker-compose.yml, FLAG SF-1 fix gốc**; curl `/healthz`+`/readyz` + migration xong + POST event→feed + curl `/api/activity/docs`+`/openapi.yaml` 200; schemathesis activity.yaml **kèm JWT** (login auth-mock :8090 direct, header Authorization; venv deterministic + base-url kèm prefix `/api/activity` — 2 bài học SF-1 contracts.yml); path-filter thêm `platform/postgres/init/**`; optional: curl gateway :8080/api/activity → 401 envelope | T6, T7 |
| T9 | README standalone (chạy native, env, contract links, ADR degraded userName) + evidence `test-run.txt` (CI run URL + hash) + push + CI xanh | T8 |

### File structure (mới)
```
services/go-svc/
├── cmd/server/main.go
├── internal/
│   ├── config/config.go
│   ├── logging/logging.go
│   ├── auth/jwt.go
│   ├── store/{migrate.go,migrations/0001_events.sql,events.go,readback.go}
│   ├── resolve/resolver.go        (spring REST + cache)
│   ├── api/{router.go,middleware.go,health.go,events.go,feed.go,stats.go,
│   │        envelope.go,openapi/activity.yaml,openapi_test.go}
│   └── swagger/{index.html,dist/... (vendored),swagger.go}
├── test/integration/…            (build tag integration — chạy CI)
├── Dockerfile
├── .dockerignore
└── README.md
.github/workflows/services-go-svc.yml
```

### Testing strategy
- Unit (go test, không DB): config fail-fast, jwt middleware, validation, envelope, resolver (httptest fake spring), feed/stats handlers với sqlmock-free fake store.
- Integration (CI, postgres service container + init script): readonly-exit criterion (seed `node_svc` → stats đúng; REVOKE → 503), ingest→feed roundtrip, 401.
- Contract (CI boot-smoke): schemathesis `contracts/openapi/activity.yaml` (pattern SF-1).
- Docker: CI docker-build + boot-smoke compose up thật.

## 6. Risks & unknowns
- **Must verify**: go_readonly grant hiệu lực qua bảng do node_svc tạo (CI test T7 chứng minh); schemathesis hoạt động với activity.yaml kèm JWT (SF-1 precedent auth.yaml + contracts.yml lessons).
- **Resolved during planning**: (1) swagger-ui-dist 5.17.14 tải OK từ npm registry (verified); (2) spring display-name field = `User.displayName` (users.yaml required) — no longer unverified; (3) go.sum không sinh được local → Dockerfile `go mod download` tự sinh in-image + CI `go mod tidy` (lệch nhỏ conventions/01 template, ghi chú README).
- **FLAG đã post (P0-2)**: compose pre-seed `DATABASE_URL`/`DATABASE_READONLY_URL` dùng user `${POSTGRES_USER}` + password per-role → auth fail chắc chắn (affects SF-2 node-svc cùng pattern). SF-4 không tự sửa compose (boundary) — dùng override file `services/go-svc/ci.compose.override.yml` cho CI của mình + REQUIREMENT-GAP comment epic FI-62 để SF-1/coordinator fix gốc.
- Go/docker không có local: mọi red-green loop qua CI push — build-test job chạy từ T1 để compile feedback sớm; budget CI runs cẩn thận.
