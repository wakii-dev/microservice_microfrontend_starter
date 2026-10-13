# SF-2 Context Pack — node-svc (task API)
> Đọc file này THAY VÌ tự tổng hợp từ bracket + epic + comments.
> Epic spec: `docs/superpowers/specs/2026-10-12-boilerplate-microservice-mfe.md` (rev 3). Bracket: `docs/superpowers/mindmaps/micro-boilerplate.wakii`.

## Spec slice (chỉ phần SF-2 chịu trách nhiệm)
1. Scaffold `services/node-svc/` từ conventions SF-1: Fastify + TypeScript, Node 22 LTS, pnpm.
2. Codegen models từ `contracts/openapi/tasks.yaml` (types only, không gen full client).
3. CRUD tasks: POST/GET/GET-by-id/PATCH/DELETE theo OpenAPI — path qua gateway là `/api/tasks/*`, service lắng nghe port 3001.
4. Validate user: khi tạo/sửa task, gọi spring-svc `GET /api/users/{id}` (timeout 2s). **Failure: spring down/timeout → 503 fail-closed** (task KHÔNG tạo; ADR ghi phương án degrade).
5. Event push: sau khi mutate task thành công → `POST /api/activity/events` sang go-svc (payload theo `activity.yaml`). **Fire-and-forget: fail → JSON log warn, KHÔNG chặn, KHÔNG retry.**
6. Postgres schema `tasks` + migration (drizzle-orm) — **migration phải sinh đúng canonical DDL `contracts/db/tasks-schema.sql`** (exit: diff = 0).
7. Healthcheck: `/healthz` + `/readyz` (ready chỉ khi DB + spring dependency check pass).
8. JSON logging theo shape chung conventions; error envelope chung.
9. CORS dev-profile (cho native mode qua dev proxy).
10. Tests: unit (vitest) + contract test (schemathesis hoặc per-route fixture theo OpenAPI).
11. Dockerfile multi-stage theo pattern conventions (dev machine không có docker — verify bằng CI).
12. **Boot-smoke CI job**: container up + curl healthz/readyz + migration chạy xong.
13. Compose entry ĐÃ PRE-SEED bởi SF-1 — SF-2 KHÔNG sửa `platform/docker-compose.yml`; chỉ bảo đảm impl khớp entry (port, env names).
14. README.md trong `services/node-svc/`: cách chạy native + docker, env vars, API summary. Exit criterion: docs đủ — chứng minh copy-dir standalone là việc SF-7.

## Touch map (files SF-2 tạo/sở hữu)
```
services/node-svc/**             [SỞ HỮU]
platform/docker-compose.yml      [READ-ONLY — SF-1 sở hữu]
platform/conventions/*           [READ-ONLY — áp dụng]
contracts/openapi/tasks.yaml     [READ-ONLY — nếu cần đổi spec = FLAG lên coordinator]
contracts/db/tasks-schema.sql    [READ-ONLY — phải khớp]
.env.example                     [READ-ONLY — env đã inventory bởi SF-1]
```

## ACCEPTANCE (user-visible)
- Swagger node-svc mở được; tạo task bằng fixture user (qua spring thật hoặc mock test) → task hiện trong danh sách; user không tồn tại → lỗi 4xx rõ.
- Spring-svc down (test mocked) → tạo task trả 503, KHÔNG tạo nửa chừng.
- CI xanh: tests + boot-smoke (container up, healthz 200, migration xong).
- Migration sinh schema khớp 100% `contracts/db/tasks-schema.sql`.
- go-svc down → tạo task VẪN thành công (chỉ log warn) — fire-and-forget đúng.

## Boundary (KHÔNG làm)
- KHÔNG sửa compose, contracts, conventions, fe-shared (đụng = flag).
- KHÔNG implement spring-svc (SF-3), go-svc (SF-4), FE (SF-5/6).
- KHÔNG tự mở CORS-wide production — chỉ dev-profile.
- KHÔNG thử `docker compose up` local (không có docker) — CI verify.
