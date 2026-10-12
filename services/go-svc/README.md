# go-svc — activity API (Go 1.24 + chi)

Service Go của boilerplate microservice: nhận activity event push (fire-and-forget) từ node-svc, serve feed + stats cho FE. Sở hữu schema `activity` (tự migrate); đọc-ONLY schema `tasks` qua postgres role `go_readonly`.

> Part of epic Boilerplate Microservice + Micro-frontend (Linear FI-62) — SF-4 / [FI-72](https://linear.app/hoivu/issue/FI-72).

## API surface

Contract nguồn sự thật: [`contracts/openapi/activity.yaml`](../../contracts/openapi/activity.yaml) — service KHÔNG codegen từ spec.

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| GET | `/healthz` | không | Liveness — `{"status":"ok"}` (naked path, compose/CI probe) |
| GET | `/readyz` | không | Readiness — migration `activity` xong + SELECT thử được schema `tasks` (readonly); fail → `503` envelope |
| GET | `/api/activity/healthz`, `/api/activity/readyz` | không | Mirror dưới prefix (auth-mock precedent) — spec activity.yaml khai health/ready dưới `servers.url` |
| POST | `/api/activity/events` | JWT | Nhận event từ node-svc — validate → persist → `202 {"accepted":true}` |
| GET | `/api/activity/feed` | JWT | Feed mới nhất trước + `total`; item bắt buộc có `userName` + `taskTitle` |
| GET | `/api/activity/stats` | JWT | `totalTasks` + `tasksByStatus` (todo/in_progress/done) + `recentEvents` (24h) — query readonly `tasks.tasks` theo canonical DDL |
| GET | `/api/activity/docs` | không | Swagger UI (static, vendored — offline) |
| GET | `/api/activity/openapi.yaml` | không | Spec copy cho swagger-ui (sync-check test chống drift với contracts) |

Qua nginx gateway (`:8080/api/activity/*`): gateway presence-check JWT (401 nếu thiếu). **Swagger UI qua gateway sẽ ăn 401** vì presence-check áp cho cả `/docs` — demo browser dùng direct port `http://localhost:8082/api/activity/docs`.

## Chạy native (dev machine không Docker)

Cần Postgres 16 với schemas + roles tạo sẵn (`platform/postgres/init/01-init.sh`):

```bash
cd services/go-svc
export PORT=8082
export DATABASE_URL='postgres://go_svc:<GO_SVC_DB_PASSWORD>@localhost:5432/boilerplate'
export DATABASE_READONLY_URL='postgres://go_readonly:<GO_READONLY_DB_PASSWORD>@localhost:5432/boilerplate'
export JWT_SECRET='<openssl rand -base64 48>'
export SPRING_SVC_URL='http://localhost:8081'          # resolve userName (tuỳ chọn dev)
export CORS_DEV_ORIGIN='http://localhost:3000,http://localhost:4001,http://localhost:4002'
export LOG_LEVEL=info
go run ./cmd/server
```

Env bắt buộc: `DATABASE_URL`, `DATABASE_READONLY_URL`, `JWT_SECRET` — thiếu → fail-fast lúc boot. Inventory đầy đủ trong [`platform/.env.example`](../../platform/.env.example).

Compose: entry `go-svc` đã pre-seed trong `platform/docker-compose.yml` — `docker compose up go-svc` (trên máy có Docker; CI verify).

## Permission model (exit criterion)

- go-svc kết nối DB bằng **2 pool**: owner `go_svc` (schema `activity` — ghi events) và `go_readonly` (chỉ SELECT schema `tasks` — stats).
- Grants không cấp tay: `ALTER DEFAULT PRIVILEGES FOR ROLE node_svc IN SCHEMA tasks GRANT SELECT TO go_readonly` — hiệu lực cho bảng do migration node-svc (SF-2) tạo sau.
- Không có grant (REVOKE) → `/stats` trả `503 {"error":{"code":"DEPENDENCY_DOWN",...}}` — permission boundary thể hiện đúng contract. Integration test + CI boot-smoke chứng minh cả 2 chiều: seed bằng role `node_svc` → stats đúng; REVOKE → 503 → GRANT lại → 200.

## Display fields (userName / taskTitle)

Contract yêu cầu feed item chứa user-display fields để FE render trực tiếp:

- `taskTitle` — lookup readonly `tasks.tasks` (best-effort lúc ingest + backfill lúc đọc).
- `userName` — resolve qua **spring-svc REST** `GET /api/users/{id}` (`displayName`), timeout 2s, cache in-memory 5 phút, passthrough `Authorization` của caller. (go_readonly KHÔNG có grant schema `users` — quyết định chốt trong `platform/postgres/init/01-init.sh`.)
- **ADR — degraded semantics**: spring/tasks down lúc ingest → display fields lưu `""`, feed vẫn trả item; lúc đọc service thử resolve lại. Giá trị `""` là trạng thái THẬT (đối tác chưa sẵn sàng), không bịa placeholder.

## Fire-and-forget semantics

node-svc push event sau khi mutate task; fail push chỉ log warn bên node, KHÔNG retry, KHÔNG chặn mutation (ADR ở SF-7). go-svc persist inline và trả `202` — không có retry/idempotency-key phía go (node không retry nên trùng hiếm; re-push → 2 dòng feed, chấp nhận cho demo).

## Tests

```bash
go test ./...                              # unit (không DB)
go test -tags integration ./test/integration/...   # integration (cần Postgres + roles, chạy trong CI)
```

CI: [`.github/workflows/services-go-svc.yml`](../../.github/workflows/services-go-svc.yml) — 3 jobs:
1. **build-test** — setup-go 1.24 + postgres service container (init script thật chạy qua psql TCP) + `go vet` + unit + integration (readonly-exit criterion).
2. **docker-build** — image multi-stage distroless.
3. **boot-smoke** — compose up → healthz → readyz **503 trước khi có tasks table** (chứng minh probe thật) → apply canonical DDL bằng role `node_svc` + seed → readyz 200 → login auth-mock → POST event → feed → stats → gateway 401 → schemathesis (kèm JWT).

## Ghi chú triển khai (lệch có chủ đích khỏi conventions/01)

- **go.sum không commit**: dev machine không có Go toolchain → `go mod tidy` chạy in-image (Dockerfile build stage) và trong CI trước build. Khi copy standalone: chạy `go mod tidy` một lần.
- **Vendored swagger-ui** (`internal/swagger/assets/`, v5.17.14, Apache-2.0 — LICENSE + NOTICE kèm theo): offline hoàn toàn, không CDN. Đặt tên `assets` thay vì `dist` để tránh root `.gitignore` (`dist/` dành cho FE builds).
- **`ci.compose.override.yml`**: override DB URL đúng role (`go_svc`/`go_readonly`) CHỈ cho CI của service này — compose pre-seed hiện inject sai khớp credentials (đã FLAG lên epic, xem comment REQUIREMENT-GAP FI-62). File này bỏ đi khi compose gốc được sửa.
- Copy-dir standalone: service chạy độc lập cần `contracts/openapi/activity.yaml` NẰM CẠNH (sync-check test skip khi thiếu) — chứng minh copy-dir là việc của SF-7.
