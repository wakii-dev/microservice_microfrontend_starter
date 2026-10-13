# node-svc — task API (Fastify + TypeScript)

Task CRUD service của boilerplate epic FI-62 (SF-2, Linear FI-70). Contract-first:
API source of truth `contracts/openapi/tasks.yaml`, DB source of truth
`contracts/db/tasks-schema.sql` (canonical DDL — migration của service này sinh
đúng cấu trúc, có test `schema-diff.test.ts` chặn diff ≠ 0).

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

pnpm --filter node-svc dev        # tsx watch, port 3001 (PORT để override)
pnpm --filter node-svc test       # vitest — 23 tests, không cần postgres
pnpm --filter node-svc build      # tsc → dist/
```

Boot sequence: env fail-fast (thiếu biến = thoát ngay) → drizzle migration →
spring reachability check (1 lần) → listen `0.0.0.0:$PORT`.

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
| `GO_SVC_URL` | ✓ | go-svc base URL — event push |
| `CORS_DEV_ORIGIN` | ✗ | Dev origins phân tách phẩy; rỗng = deny-by-default |
| `LOG_LEVEL` | ✗ (default info) | debug\|info\|warn\|error |

## API summary (chi tiết: contracts/openapi/tasks.yaml)

| Method | Path | Ghi chú |
|--------|------|---------|
| GET | `/api/tasks` | filter `status`,`assigneeId`; `limit` (1-100, default 20), `offset` |
| GET | `/api/tasks/{taskId}` | 404 `TASK_NOT_FOUND`; non-uuid → 400 |
| POST | `/api/tasks` | `{title, description?, assigneeId?}` → 201; validate assignee (xem failure semantics) |
| PATCH | `/api/tasks/{taskId}` | minProperties 1; **KHÔNG null được assigneeId** (contract non-nullable) |
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
- **Event push — fire-and-forget**: sau mutate thành công → POST
  `{GO_SVC_URL}/api/activity/events` (timeout 2s, KHÔNG await — response trả
  ngay sau DB commit, KHÔNG retry). go-svc down → chỉ log warn `event push
  failed`; tạo task VẪN thành công (có test + boot-smoke assert). Trade-off
  (ADR): chấp nhận mất event activity khi go-svc không khả dụng — activity là
  nice-to-have, không phải source of truth của task.
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

- Unit/contract (23): auth (missing/bad signature/expired/wrong iss), CRUD
  happy + validation + 404/422/503, fire-and-forget (go-svc closed port →
  vẫn 201), CORS (echo dev origin / deny-by-default), readyz DB fail.
- `schema-diff.test.ts`: migration vs canonical DDL — structural normalized
  comparison (exit criterion SF-2 diff=0).
- CI (`services-node-svc.yml`): native build+test, docker build, **boot-smoke**
  (compose postgres thật → container node-svc → healthz/readyz 200 → tạo/list/
  xoá task bằng JWT CI → assert 201 khi go-svc vắng).

## Copy-dir standalone (cho SF-7)

Thư mục này tự chứa đủ: package.json + local pnpm-lock.yaml (không phụ thuộc
workspace root), Dockerfile, README. Copy kèm `contracts/` nếu cần spec.
