# node-svc — task API (Fastify + TypeScript)

Task CRUD service của boilerplate epic FI-62 (SF-2, Linear FI-70). Contract-first:
API source of truth `contracts/openapi/tasks.yaml`, DB source of truth
`contracts/db/tasks-schema.sql` (canonical DDL — migration của service này sinh
đúng cấu trúc, có test `schema-diff.test.ts` chặn diff ≠ 0).

Epic FI-76 (SF-2 FI-79) thêm **transactional outbox + Kafka producer/consumer**
(ADR-0008, conventions/09): mutation task + outbox ghi CÙNG 1 tx, relay publish
topic `task-events`, compensation consumer nhận `task.assignment_failed`.

## Chạy native (dev — máy không Docker)

```bash
# từ repo root — pnpm workspace
pnpm install --frozen-lockfile

# cần postgres 16 chạy sẵn (local/remote) — role node_svc + schema tasks
# (schema tạo bởi platform/postgres/init/01-init.sh khi chạy compose; native
# tự tạo thì dùng: CREATE ROLE node_svc LOGIN PASSWORD '...'; CREATE SCHEMA tasks;)
export DATABASE_URL="postgres://node_svc:<NODE_SVC_DB_PASSWORD>@localhost:5432/boilerplate"
export JWT_SECRET="<cùng giá trị auth-mock dùng để ký>"
export SPRING_SVC_URL="http://localhost:8081"   # default native
export GO_SVC_URL="http://localhost:8082"
export CORS_DEV_ORIGIN="http://localhost:3000,http://localhost:4001,http://localhost:4002"
export LOG_LEVEL=info
# export KAFKA_BROKERS="localhost:9092"  # optional — thiếu = relay + consumer không start

pnpm --filter node-svc dev        # tsx watch, port 3001 (PORT để override)
pnpm --filter node-svc test       # vitest — 48 tests, không cần postgres/kafka
pnpm --filter node-svc build      # tsc → dist/
```

Boot sequence: env fail-fast (thiếu biến = thoát ngay) → drizzle migration →
spring reachability check (1 lần) → relay + compensation consumer (chỉ khi có
`KAFKA_BROKERS` — lazy, KHÔNG chặn boot/readyz) → listen `0.0.0.0:$PORT`.

Swagger UI: `http://localhost:3001/api/tasks/docs` (mirror tối thiểu của
tasks.yaml). Qua gateway `:8080/api/tasks/docs` cần Bearer token (gateway
presence-check chặn browser không token).

## Chạy docker

```bash
docker compose -f platform/docker-compose.yml --env-file platform/.env.example up -d --build node-svc
# compose inject: PORT, DATABASE_URL, JWT_SECRET, SPRING_SVC_URL, GO_SVC_URL,
#                CORS_DEV_ORIGIN, LOG_LEVEL
```

Image multi-stage (conventions/01): `node:22-alpine`, `pnpm install
--frozen-lockfile`, chạy non-root `USER node`, EXPOSE 3001. Local lockfile
`pnpm-lock.yaml` (thư mục này, sinh bằng `pnpm install --ignore-workspace`) vì
compose build context = thư mục này — root workspace lockfile không vào được
context. Healthcheck khai ở compose (conventions/01 rule 4).

## Env vars

| Biến | Bắt buộc | Ý nghĩa |
|------|----------|---------|
| `PORT` | ✓ (compose set 3001) | Listen port — conventions/05 |
| `DATABASE_URL` | ✓ | Postgres URL, role `node_svc`, search_path `tasks` |
| `JWT_SECRET` | ✓ | Secret HS256 — verify token auth-mock (token-contract.md) |
| `SPRING_SVC_URL` | ✓ | spring-svc base URL — validate assignee |
| `GO_SVC_URL` | ✓ | (hiện không dùng — event push đã thay bằng outbox; giữ cho compose inject không fail) |
| `CORS_DEV_ORIGIN` | ✗ | Dev origins phân tách phẩy; rỗng = deny-by-default |
| `LOG_LEVEL` | ✗ (default info) | debug\|info\|warn\|error |
| `KAFKA_BROKERS` | ✗ | Phẩy-phân-tách broker list (vd `kafka:9092`). Thiếu = relay + compensation consumer KHÔNG start (warn 1 lần) — lazy-connect, KHÔNG vào readyz (conventions/09 rule 1) |

## API summary (chi tiết: contracts/openapi/tasks.yaml)

| Method | Path | Ghi chú |
|--------|------|---------|
| GET | `/api/tasks` | filter `status`,`assigneeId`; `limit` (1-100, default 20), `offset` |
| GET | `/api/tasks/{taskId}` | 404 `TASK_NOT_FOUND`; non-uuid → 400 |
| POST | `/api/tasks` | `{title, description?, assigneeId?}` → 201; validate assignee (xem failure semantics) |
| PATCH | `/api/tasks/{taskId}` | minProperties 1; **KHÔNG null được assigneeId** (contract non-nullable); `status` chỉ nhận writable 3 giá trị — `assignment_failed` system-owned (compensation ghi, không client) |
| DELETE | `/api/tasks/{taskId}` | 204 |
| GET | `/healthz` (naked + `/api/tasks/healthz`) | liveness — không auth |
| GET | `/readyz` (naked + `/api/tasks/readyz`) | readiness — không auth |

Auth: mọi `/api/tasks/*` business route bắt buộc `Authorization: Bearer <JWT>`;
service TỰ verify signature + exp + iss (không tin gateway) → sai/hết hạn →
401 `{"error":{"code":"UNAUTHORIZED",...}}`.

## Failure semantics (đọc trước khi đổi)

- **User validation — fail-closed**: POST/PATCH có `assigneeId` → `GET
  {SPRING_SVC_URL}/api/users/{id}` timeout 2s. spring 404 → **422
  UNPROCESSABLE** (task không ghi); spring down/timeout → **503
  DEPENDENCY_DOWN** (task không ghi — không có nửa chừng). Degrade method
  (ADR): khi spring down, FE vẫn đọc/xoá task được; chỉ blocked thao tác có
  assignee mới. Chọn fail-closed vì `assignee_id` không có FK chéo schema —
  DB không tự chắn assignee ma (canonical DDL comment #1).
- **Event push — transactional outbox (ADR-0008, thay fire-and-forget ADR-0006)**:
  mutation + INSERT `tasks.outbox` trong CÙNG 1 tx (`repo.drizzle.ts` — seam-fail
  test chứng minh task + outbox cùng biến mất). Relay poll 500ms publish topic
  `task-events` (key = `payload.taskId`, envelope khớp golden fixtures
  `contracts/events/fixtures/`) rồi mark `published_at`; publish fail = retry
  tick sau (at-least-once, consumer dedupe bằng envelope `id`); purge row
  published cũ > 7 ngày. Event matrix PRESENCE-BASED (ADR-0008): POST →
  `task.created`; PATCH có `assigneeId` → `task.assigned` (+`task.updated` nếu
  body còn field khác); PATCH không `assigneeId` → `task.updated`; DELETE →
  `task.deleted`. Envelope `id` UUIDv4 do repo sinh từng event.
- **Compensation consumer (saga)**: group `node-svc-compensation`, CHỈ xử lý
  `task.assignment_failed` (filter-by-type — task-events.md): conditional UPDATE
  `SET status='assignment_failed' WHERE id AND assignee_id=<event.assigneeId>
  AND status <> 'assignment_failed'` — guard chống stale compensation
  (assignee khác / event lặp = không đổi), idempotent. Manual offset commit
  SAU khi DB op xong; lỗi DB retry ×3 in-memory → hết lượt vào
  `task-events.dlq` rồi commit (KHÔNG block partition — conventions/09 rule 7).
- **Readiness — deviation ghi nhận**: `/readyz` = DB migrated + SELECT 1 ok
  (hard gate). Spring reachability chỉ kiểm 1 lần lúc boot + log warn, KHÔNG
  gate ready — lệch wordings của conventions/02 và summary `/readyz` trong
  tasks.yaml (cả hai nói "spring dependency pass"). Lý do: SF-3 (spring-svc)
  deploy song song/lifecycle riêng — nếu readyz gate cứng vào spring thì
  node-svc không bao giờ nhận traffic khi spring restart; validation đã
  fail-closed ở request-time nên user-visible không đổi. SF-7 docs-sync:
  cập nhật conventions/02 khi convergence, đừng "fix ngược" README này.
- **Error envelope**: mọi 4xx/5xx theo `platform/conventions/04` — Fastify
  error gốc (FST_ERR_*) được map sang envelope, validation → 400
  `VALIDATION_ERROR`.

## Tests

```bash
pnpm --filter node-svc test
```

- Unit/contract (48): auth (missing/bad signature/expired/wrong iss), CRUD
  happy + validation + 404/422/503, **outbox event matrix** (payload so golden
  fixtures — load chung với relay test + consumer test SF-3), seam-fail giữa
  2 step → task + outbox cùng biến mất, PATCH `assignment_failed` → 400, GET
  `assignment_failed` → 200, CORS (echo dev origin / deny-by-default), readyz
  DB fail.
- `schema-diff.test.ts`: migration vs canonical DDL — structural normalized
  comparison (exit criterion SF-2 diff=0; bảng `tasks.outbox` whitelist riêng —
  node-internal infra, KHÔNG vào canonical DDL).
- `repo.drizzle.test.ts`: mutation + outbox trong CÙng 1 tx (mock-db — rollback
  thật của postgres chứng minh ở CI boot-smoke + saga e2e).
- `outbox-relay.test.ts` / `compensation-consumer.test.ts`: publish đúng golden
  fixture format; filter-by-type + conditional guard + retry ×3 → DLQ.
- CI (`services-node-svc.yml`): native build+test, docker build, **boot-smoke**
  (compose postgres thật → CRUD smoke bằng JWT CI), **kafka-boot-smoke**
  (postgres + kafka + node-svc → tạo task → assert outbox row
  `published_at IS NOT NULL` — relay THẬT trên broker thật, P0 plan-critic).

## Copy-dir standalone (cho SF-7)

Thư mục này tự chứa đủ: package.json + local pnpm-lock.yaml (không phụ thuộc
workspace root), Dockerfile, README. Copy-dir phải KÈM dependency ngoài mà test
resolve tới repo-relative:
- `contracts/db/tasks-schema.sql` — `schema-diff.test.ts` đọc (FLAG sẵn
  convergence.yml:62, đã gặp ở SF-7);
- `contracts/events/fixtures/*.json` — relay/consumer test load chung (2 đầu
  cùng nguồn sự thật, task-events.md).
