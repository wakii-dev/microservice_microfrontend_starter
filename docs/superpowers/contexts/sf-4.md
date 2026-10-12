# SF-4 Context Pack — go-svc (activity API)
> Đọc file này THAY VÌ tự tổng hợp từ bracket + epic + comments.
> Epic spec: `docs/superpowers/specs/2026-10-12-boilerplate-microservice-mfe.md` (rev 3). Bracket: `docs/superpowers/mindmaps/micro-boilerplate.wakii`.

## Spec slice (chỉ phần SF-4 chịu trách nhiệm)
1. Scaffold `services/go-svc/`: Go 1.24.x + chi router.
2. Feed + stats endpoints theo `contracts/openapi/activity.yaml` — response chứa user-display fields (userName, taskTitle) như spec yêu cầu.
3. Nhận `POST /activity/events` (caller là node-svc SF-2 — KHÔNG cần edge depends-on: contract của SF-1 đủ, tích phân thật do SF-7 smoke chứng minh). Payload: taskId, userId, action, timestamp.
4. Postgres: **schema `activity` MÌNH migrate** (bảng events); ĐỌC-ONLY schema `tasks` — query theo canonical DDL `contracts/db/tasks-schema.sql`; kết nối bằng readonly role (grants đã cấp bởi SF-1 qua `ALTER DEFAULT PRIVILEGES`).
5. JWT enforcement: tự verify signature + expiry; sai/hết hạn → 401.
6. Healthcheck `/healthz` + `/readyz`; slog JSON shape chung; error envelope chung; CORS dev-profile.
7. Tests: unit (go test) + contract (theo OpenAPI; có test chứng minh readonly đọc được: seed rows tasks bằng owner role → stats trả về đúng).
8. Dockerfile multi-stage distroless.
9. **Boot-smoke CI job** (up + health + migration xong).
10. Swagger-ui static serve OpenAPI activity spec (không swag codegen — spec là nguồn).
11. Compose entry PRE-SEED — KHÔNG sửa `platform/docker-compose.yml`.
12. README.md trong `services/go-svc/`. Exit: docs đủ (copy-dir proof là SF-7).

## Touch map (files SF-4 tạo/sở hữu)
```
services/go-svc/**               [SỞ HỮU]
platform/docker-compose.yml      [READ-ONLY — SF-1]
platform/conventions/*           [READ-ONLY]
contracts/openapi/activity.yaml  [READ-ONLY — đổi = FLAG]
contracts/db/tasks-schema.sql    [READ-ONLY — query theo]
.env.example                     [READ-ONLY]
```

## ACCEPTANCE (user-visible)
- Swagger-ui go-svc mở được; POST event → event hiện trong feed; stats phản ánh đúng rows tasks (test seed qua owner role).
- Không có readonly grant (test negative) → query tasks fail rõ ràng — chứng minh permission boundary.
- Token sai → 401 từ go-svc.
- CI xanh: tests + boot-smoke (up, health, migration activity xong).

## Boundary (KHÔNG làm)
- KHÔNG migrate schema `tasks` (SF-2 sở hữu — go chỉ ĐỌC).
- KHÔNG sửa compose/contracts/conventions (đụng = flag).
- KHÔNG implement node/spring/FE.
- KHÔNG thêm message broker — event là REST push fire-and-forget từ node-svc.
- KHÔNG thử docker local — CI verify.
