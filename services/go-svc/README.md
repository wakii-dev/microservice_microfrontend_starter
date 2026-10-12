# go-svc — activity API (Go 1.24 + chi)

> KHUNG RỖNG ở SF-1 — **SF-4 (Linear FI-72) sở hữu từ tier 1**. Điền impl vào entry compose có sẵn tại `platform/docker-compose.yml` (KHÔNG sửa compose — chỉ code trong thư mục này).

## Contract SF-4 phải theo (đọc trước khi code)

- API: `contracts/openapi/activity.yaml` — POST /events (nhận push fire-and-forget từ node-svc), feed (BẮT BUỘC user-display fields userName/taskTitle), stats (query readonly schema `tasks` theo canonical DDL)
- DB: tự migrate schema `activity`; đọc-ONLY schema `tasks` qua role `go_readonly` (grants: `platform/postgres/init/01-init.sh` — ALTER DEFAULT PRIVILEGES, hiệu lực cho bảng sinh sau)
- Exit criterion readonly: seed rows bằng owner role → stats trả đúng
- Conventions: `platform/conventions/` (multi-stage distroless, healthcheck, slog JSON, error envelope, port 8082, CORS dev-profile)
- Compose entry đã pre-seed với env: `PORT`, `DATABASE_URL`, `DATABASE_READONLY_URL`, `JWT_SECRET`, `SPRING_SVC_URL`, `CORS_DEV_ORIGIN`, `LOG_LEVEL`
- Boot-smoke CI job pattern: `.github/workflow-templates/services-ci.yml.example`
