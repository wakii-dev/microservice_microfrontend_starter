# SF-2 Spec — node-svc task API (FI-70)

> Derived từ epic spec `2026-10-12-boilerplate-microservice-mfe.md` rev 3 (đã user-approved + spec-critic + plan-critic ở epic level) + context pack `docs/superpowers/contexts/sf-2.md`. SF dispatch 2026-10-12, worktree `__STACK_ORG__/sf-2-node-svc`. Spec-critic vòng 1: FIX-P0-FIRST → 2 P0 đã resolve + P1/P2 pinned (xem §Decisions).

## Problem
`services/node-svc/` là khung rỗng. Epic cần service task CRUD chạy được qua gateway để chứng minh acceptance #2 (tạo task → user được spring validate).

## Scope (in)
1. Scaffold Fastify + TypeScript, Node 22 LTS, pnpm (workspace entry đã khai trong `pnpm-workspace.yaml`).
2. Codegen types từ `contracts/openapi/tasks.yaml` (`openapi-typescript`, types only) — **output commit** (`src/types/api.d.ts`, contracts/ ngoài docker build context nên không gen trong image); CI re-generate + `git diff --exit-code` chống drift.
3. CRUD: POST/GET/GET-by-id/PATCH/DELETE `/api/tasks/*` (service tự mount prefix — gateway pass-through), port 3001. Non-uuid `taskId` → 400 `VALIDATION_ERROR`; không thấy task → 404 code `TASK_NOT_FOUND` (đúng ví dụ tasks.yaml; conventions/04 catalog là "tối thiểu").
4. Validate user: tạo/sửa khi có `assigneeId` → gọi `GET {SPRING_SVC_URL}/api/users/{id}` timeout 2s. spring 404 → **422 UNPROCESSABLE**; spring down/timeout → **503 DEPENDENCY_DOWN fail-closed** (task KHÔNG ghi; ADR degrade ghi README).
5. Event push fire-and-forget: sau mutate thành công → `POST {GO_SVC_URL}/api/activity/events`, payload `ActivityEventInput` (activity.yaml), action `task.created|task.updated|task.deleted`. **Không await** (đáp trả ngay sau khi DB commit), fetch có `AbortSignal.timeout(2000)` (không leak socket khi go-svc hang), `.catch` → pino warn `event push failed`, không retry.
6. Postgres schema `tasks` + migration drizzle-orm khớp canonical DDL `contracts/db/tasks-schema.sql`. **Diff methodology (spec-critic P1): so sánh cấu trúc chuẩn hoá** — schema/columns(type/nullability/default)/CHECK definition/3 indexes (incl. `created_at DESC`) — đã implement trong `src/db/schema-diff.test.ts` (bỏ khác biệt cosmetic: quote/comment/USING btree/NULLS LAST/tên constraint). Migration `CREATE SCHEMA IF NOT EXISTS` (idempotent với schema init script 01-init.sh đã tạo sẵn). id = uuid v4 app-generated; status varchar + CHECK; bảng do role `node_svc` tạo (search_path tasks) — xem §Decisions D1 về compose bug.
7. `/healthz` naked 200 `{"status":"ok"}`; `/readyz` naked = DB migrated + SELECT ok (503 envelope khi fail); **mirror `/api/tasks/healthz` + `/api/tasks/readyz`** (pattern auth-mock — contract fixtures theo tasks.yaml servers.url chạy được). Boot-time spring reachability check 1 lần + log warn, KHÔNG gate ready (deviation so với conventions/02 + summary tasks.yaml — cite cả hai trong README; fail-closed enforce ở request-time mục 4). Lưu ý: check này chỉ có tác dụng observability — executor KHÔNG tự invent gating.
8. JWT: tự verify HS256 (JWT_SECRET) + exp + iss=`auth-mock` trên mọi business route; 401 envelope `UNAUTHORIZED`. healthz/readyz (cả naked lẫn mirror) không auth.
9. JSON log pino shape conventions/03 (ts/level/service/msg/requestId từ X-Request-Id); error handler map mọi error (kể cả FST_ERR_*) sang envelope conventions/04.
10. CORS `@fastify/cors` origin từ `CORS_DEV_ORIGIN` (deny-by-default khi rỗng), methods GET/POST/PATCH/DELETE, headers Authorization/Content-Type/X-Request-Id.
11. Swagger UI `/api/tasks/docs` (mirror tối thiểu tasks.yaml). **Acceptance "swagger mở được" = native** `localhost:3001/api/tasks/docs` (browser-verify khi chạy local); qua gateway :8080 thì cần Bearer header (CI curl-verify được — gateway presence-check chặn browser không token).
12. Tests vitest: unit routes (happy CRUD, 400/401/404/422/503 với fake spring inject, fire-and-forget go-svc down → vẫn 201 + warn), healthz/readyz (DB fail → 503), schema-diff. Mọi external call inject qua app factory opts (không network thật).
13. Dockerfile multi-stage theo conventions/01 (node:22-alpine, `pnpm install --frozen-lockfile`, build dist, USER node, EXPOSE 3001) + `.dockerignore`. **Lockfile strategy (spec-critic P0-2):** local standalone `services/node-svc/pnpm-lock.yaml` (sinh bằng `pnpm install --ignore-workspace`) vì compose build context = `services/node-svc` không thấy root lockfile; root `pnpm-lock.yaml` (workspace) phục vụ dev/CI native — **root lockfile là file touched**, commit cả hai.
14. CI `.github/workflows/services-node-svc.yml`: (a) build+test native (root `pnpm install --frozen-lockfile` + `pnpm --filter node-svc test` + build + typegen drift check); (b) docker build; (c) **boot-smoke**: `docker compose up -d --build postgres node-svc` (init thật tạo role node_svc; DATABASE_URL từ compose — GAP-ANSWER D1: coordinator đã fix @ab207d8 thành `postgres://node_svc:${NODE_SVC_DB_PASSWORD}@...`) → healthz/readyz 200 trên localhost:3001 → ký JWT CI (node crypto, không deps) → POST task **KHÔNG assigneeId** → 201 (với go-svc vắng mặt = evidence fire-and-forget) → GET list thấy → DELETE 204.
15. README `services/node-svc/`: chạy native + docker, env vars (+ default native SPRING_SVC_URL/GO_SVC_URL `localhost:8081/8082`), API summary, failure semantics + ADR degrade, readyz deviation note (cite conventions/02 + tasks.yaml), ghi chú PATCH không thể null `assigneeId` (UpdateTaskRequest.assigneeId non-nullable trong tasks.yaml). Exit: docs đủ standalone (copy-dir là việc SF-7).

## Env consumed (đã pre-seed trong compose — KHÔNG thêm biến mới vào .env.example)
`PORT`(3001), `DATABASE_URL` (role node_svc), `JWT_SECRET`, `SPRING_SVC_URL`, `GO_SVC_URL`, `CORS_DEV_ORIGIN`, `LOG_LEVEL`.

## Out of scope / boundary
- KHÔNG sửa compose, contracts, conventions, gateway, postgres init, fe-shared, .env.example, pnpm-workspace.yaml (đụng = FLAG coordinator).
- KHÔNG implement spring-svc/go-svc/FE. KHÔNG CORS-wide. KHÔNG docker local.

## Decisions (spec-critic vòng 1, 2026-10-12)
- **D1 (P0) compose DATABASE_URL sai credential semantics — RESOLVED**: flag đã gửi coordinator; GAP-ANSWER 2026-10-12: fix landed trên dest @ab207d8 (`postgres://node_svc:${NODE_SVC_DB_PASSWORD}@...` khớp init roles). SF-2 đã merge dest; boot-smoke dùng compose entry chuẩn, KHÔNG override.
- **D2 (P0) lockfile vs build context**: giữ workspace membership (SF-1 seeded); thêm local standalone lockfile cho Docker path (mục 13). Đã verify root `pnpm install --frozen-lockfile` vẫn sạch với local lockfile tồn tại.
- **D3 (P1) readyz**: ready = DB only; spring check boot-time warn-only — SF-3 song song chưa tồn tại, readyz gate cứng vào spring làm boot-smoke CI không thể xanh.

## Acceptance (mirror context pack)
- Swagger node-svc mở được (native, mục 11); tạo task với user fixture → task hiện trong list; assignee không tồn tại → 422 rõ.
- Spring down (mocked test) → 503, không ghi nửa chừng.
- CI xanh: build+test + docker build + boot-smoke (healthz/readyz 200, migration xong, task create/list/delete smoke, 201 khi go-svc vắng).
- Migration khớp 100% canonical DDL (schema-diff test, methodology mục 6).
- go-svc down → tạo task VẪN thành công (warn log) — fire-and-forget.
