# go-svc — activity API + Kafka consumer (Go 1.24 + chi)

Service Go của boilerplate microservice: consume activity event qua **Kafka** topic `task-events` (idempotent, retry ×3 → DLQ + saga compensation), serve feed + stats cho FE. Sở hữu schema `activity` (tự migrate); đọc-ONLY schema `tasks` qua postgres role `go_readonly`.

> Part of story Kafka + Outbox + Saga (Linear FI-76) — SF-3 / [FI-80](https://linear.app/hoivu/issue/FI-80). Supersedes luồng REST fire-and-forget của SF-4 (ADR-0008 supersede ADR-0006).

## API surface

Contract nguồn sự thật: [`contracts/openapi/activity.yaml`](../../contracts/openapi/activity.yaml) — service KHÔNG codegen từ spec. Snapshot nhúng `internal/api/openapi/activity.yaml` phải **bit-identical** với contract (CI job `drift-guard` chặn lệch).

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| GET | `/healthz` | không | Liveness — `{"status":"ok"}` (naked path, compose/CI probe) |
| GET | `/readyz` | không | Readiness — migration `activity` xong + SELECT thử được schema `tasks` (readonly); fail → `503` envelope |
| GET | `/api/activity/healthz`, `/api/activity/readyz` | không | Mirror dưới prefix (auth-mock precedent) |
| GET | `/api/activity/feed` | JWT | Feed mới nhất trước + `total`; item bắt buộc có `userName` + `taskTitle` |
| GET | `/api/activity/stats` | JWT | `totalTasks` + `tasksByStatus` (todo/in_progress/done/assignment_failed) + `recentEvents` (24h) |
| GET | `/api/activity/docs` | không | Swagger UI (static, vendored — offline) |
| GET | `/api/activity/openapi.yaml` | không | Spec copy cho swagger-ui (sync-check test + drift-guard chống drift với contracts) |
| ~~POST~~ | ~~`/api/activity/events`~~ | — | **ĐÃ THANH LÝ** (SF-3) → `404` — event đi qua Kafka consumer (ADR-0008) |

Qua nginx gateway (`:8080/api/activity/*`): gateway presence-check JWT (401 nếu thiếu). **Swagger UI qua gateway sẽ ăn 401** vì presence-check áp cho cả `/docs` — demo browser dùng direct port `http://localhost:8082/api/activity/docs`.

## Kafka consumer (SF-3)

Hợp đồng: [`contracts/events/task-events.md`](../../contracts/events/task-events.md) + [`platform/conventions/09-async-messaging.md`](../../platform/conventions/09-async-messaging.md). Thư viện `segmentio/kafka-go` (ADR-0008: franz-go là path production).

- **Group** `go-svc-activity`, `auto.offset.reset: earliest`, 1 partition; filter-by-type — nhận mọi type TRỪ `task.assignment_failed` (compensating là của node-svc).
- **Idempotency**: envelope `id` do producer (node outbox) sinh — `INSERT ... ON CONFLICT (id) DO NOTHING`; at-least-once redelivery không nhân đôi feed.
- **Manual commit SAU khi xử lý xong** (DB insert đã commit hoặc message đã vào DLQ) — conventions/09 rule 5.
- **Retry ×3 in-memory** (backoff 500ms) → hết lượt: publish compensating `task.assignment_failed` (envelope id MỚI do go sinh — chỉ khi nguồn là `task.assigned`, saga semantics) vào `task-events` + đẩy message gốc + metadata lỗi vào `task-events.dlq`. KHÔNG block partition, KHÔNG requeue.
- **Lazy-connect**: broker chưa lên lúc boot chỉ log warn + retry vòng kế — KHÔNG crash, KHÔNG vào readyz, không service nào depends_on kafka.
- **Saga fail hook**: `task.assigned` có `assigneeId = 55555555-...` (fixture `svc-fail`) → Handler cố tình fail — deterministic cho e2e saga (SF-5): retry ×3 → compensating → node mark task `assignment_failed`.

## Service-token (resolver)

go consumer không có HTTP caller để passthrough `Authorization` — tự login fixture service user **`svc-activity`** (`AUTH_MOCK_URL` + `SVC_ACTIVITY_PASSWORD`, giá trị khớp `AUTH_MOCK_DEV_PASSWORD`): warmup retry backoff lúc boot (KHÔNG crash khi auth-mock chưa lên), cache JWT 30 phút, **lazy re-login** khi spring trả 401. Resolver dùng token này enrich `userName` lúc consume (feed đọc lại sẽ backfill nếu `""`).

## Chạy native (dev machine không Docker)

Cần Postgres 16 với schemas + roles tạo sẵn (`platform/postgres/init/01-init.sh`) + Kafka (`apache/kafka` hoặc `redpanda`, bootstrap `localhost:9092`):

```bash
cd services/go-svc
export PORT=8082
export DATABASE_URL='postgres://go_svc:<GO_SVC_DB_PASSWORD>@localhost:5432/boilerplate'
export DATABASE_READONLY_URL='postgres://go_readonly:<GO_READONLY_DB_PASSWORD>@localhost:5432/boilerplate'
export JWT_SECRET='<openssl rand -base64 48>'
export KAFKA_BROKERS='localhost:9092'
export SVC_ACTIVITY_PASSWORD='demo-password'
export AUTH_MOCK_URL='http://localhost:8090'
export SPRING_SVC_URL='http://localhost:8081'          # resolve userName (tuỳ chọn dev)
export CORS_DEV_ORIGIN='http://localhost:3000,http://localhost:4001,http://localhost:4002'
export LOG_LEVEL=info
go run ./cmd/server
```

Env bắt buộc: `DATABASE_URL`, `DATABASE_READONLY_URL`, `JWT_SECRET`, `KAFKA_BROKERS`, `SVC_ACTIVITY_PASSWORD` — thiếu → fail-fast lúc boot. Inventory đầy đủ trong [`platform/.env.example`](../../platform/.env.example).

Compose: entry `go-svc` đã pre-seed env Kafka/service-token trong `platform/docker-compose.yml` — `docker compose up go-svc` (trên máy có Docker; CI verify).

## Permission model (exit criterion)

- go-svc kết nối DB bằng **2 pool**: owner `go_svc` (schema `activity` — ghi events) và `go_readonly` (chỉ SELECT schema `tasks` — stats).
- Grants không cấp tay: `ALTER DEFAULT PRIVILEGES FOR ROLE node_svc IN SCHEMA tasks GRANT SELECT TO go_readonly` — hiệu lực cho bảng do migration node-svc (SF-2) tạo sau.
- Không có grant (REVOKE) → `/stats` trả `503 {"error":{"code":"DEPENDENCY_DOWN",...}}` — permission boundary thể hiện đúng contract. Integration test + CI boot-smoke chứng minh cả 2 chiều: seed bằng role `node_svc` → stats đúng; REVOKE → 503 → GRANT lại → 200.

## Display fields (userName / taskTitle)

Contract yêu cầu feed item chứa user-display fields để FE render trực tiếp:

- `taskTitle` — lookup readonly `tasks.tasks` (best-effort lúc consume + backfill lúc đọc).
- `userName` — resolve qua **spring-svc REST** `GET /api/users/{id}` (`displayName`) bằng **service-token** (consumer path) hoặc passthrough `Authorization` (feed-read path), timeout 2s, cache in-memory 5 phút. (go_readonly KHÔNG có grant schema `users`.)
- **ADR — degraded semantics**: spring/tasks down lúc consume → display fields lưu `""`, feed vẫn trả item; lúc đọc service thử resolve lại. Giá trị `""` là trạng thái THẬT (đối tác chưa sẵn sàng), không bịa placeholder.

## Tests

```bash
go test ./...                              # unit (không DB/kafka — golden fixtures + fake producer)
go test -tags integration ./test/integration/...   # integration (cần Postgres + roles, chạy trong CI)
```

CI: [`.github/workflows/services-go-svc.yml`](../../.github/workflows/services-go-svc.yml) — 4 jobs:
1. **build-test** — setup-go 1.24 + postgres service container (init script thật chạy qua psql TCP) + `go vet` + unit (consumer golden fixtures, retry/DLQ fake) + integration (readonly-exit + idempotency duplicate envelope id = 1 row).
2. **docker-build** — image multi-stage distroless.
3. **boot-smoke** — compose up (postgres + auth-mock + **kafka**) → readyz **503 trước khi có tasks table** → DDL role `node_svc` + seed → readyz 200 → **tạo topic tường minh** (`kafka-topics.sh --create` task-events + dlq) → **console producer publish golden fixture** (exec trong container) → poll feed có row (proof event→feed) → **publish duplicate → feed không nhân đôi** (idempotency e2e) → stats 4 keys → POST /events **404** → gateway 401 → schemathesis.
4. **drift-guard** — `diff` snapshot activity.yaml vs contracts (sửa 1 bỏ 1 = fail).

## Ghi chú triển khai (lệch có chủ đích khỏi conventions/01)

- **go.sum không commit**: dev machine không có Go toolchain → `go mod tidy` chạy in-image (Dockerfile build stage) và trong CI trước build. Khi copy standalone: chạy `go mod tidy` một lần.
- **Vendored swagger-ui** (`internal/swagger/assets/`, v5.17.14, Apache-2.0 — LICENSE + NOTICE kèm theo): offline hoàn toàn, không CDN. Đặt tên `assets` thay vì `dist` để tránh root `.gitignore` (`dist/` dành cho FE builds).
- **`ci.compose.override.yml`**: override DB URL đúng role (`go_svc`/`go_readonly`) CHỈ cho CI của service này — compose pre-seed hiện inject sai khớp credentials (đã FLAG lên epic, xem comment REQUIREMENT-GAP FI-62). File này bỏ đi khi compose gốc được sửa.
- Copy-dir standalone: service chạy độc lập cần `contracts/openapi/activity.yaml` NẰM CẠNH (sync-check test skip khi thiếu) — chứng minh copy-dir là việc của SF-7.
