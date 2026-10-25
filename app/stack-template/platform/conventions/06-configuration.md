# 06 — Configuration: 100% qua env-var

Không config file riêng cho service. Không hardcode secret. 12-factor.

## Quy tắc

1. **Mọi cấu hình theo môi trường đi qua env-var** — DB URL, JWT secret, port, URL service láng giềng, level log.
2. `platform/.env.example` là **inventory ĐẦY ĐỦ** — thêm env var mới cho service nào phải thêm vào đó cùng commit, kèm comment 1 dòng giải thích. `.env` gitignored.
3. Compose đọc `.env` tự động (file cùng thư mục `platform/`); CI dùng `--env-file platform/.env.example` cho job chỉ validate.
4. Secret (`JWT_SECRET`, `POSTGRES_PASSWORD`, DB passwords): `.env.example` chứa **placeholder** rõ ràng (`change-me-...`), giá trị thật chỉ trong `.env` local / CI secret.
5. Tên env var: `SCREAMING_SNAKE_CASE`, prefix theo service (`NODE_SVC_*`, `SPRING_SVC_*`, `GO_SVC_*`, `AUTH_MOCK_*`) trừ shared (`JWT_SECRET`, `POSTGRES_*`, `GATEWAY_PORT`).
6. Service fail-fast khi thiếu env bắt buộc lúc boot (không fallback im lặng giá trị mặc định cho secret).

## Nhóm env chính (chi tiết đầy đủ trong `.env.example`)

| Nhóm | Biến |
|------|------|
| Shared secret | `JWT_SECRET` |
| Postgres | `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT` |
| Per-service DB creds | `NODE_SVC_DB_PASSWORD`, `SPRING_SVC_DB_PASSWORD`, `GO_SVC_DB_PASSWORD`, `GO_READONLY_DB_PASSWORD` |
| Ports | xem [05-ports.md](05-ports.md) |
| URLs inter-service | `SPRING_SVC_URL`, `AUTH_MOCK_URL`, `SHELL_URL`, `REMOTE_TASKS_URL`, `REMOTE_ACTIVITY_URL` |
| CORS | `CORS_DEV_ORIGIN` |
| Log | `LOG_LEVEL` |
| Mock auth | `AUTH_MOCK_DEV_PASSWORD`, `USERS_FIXTURE_PATH` |
