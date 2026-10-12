# spring-svc — user API (Spring Boot 3)

> KHUNG RỖNG ở SF-1 — **SF-3 (Linear FI-71) sở hữu từ tier 1**. Điền impl vào entry compose có sẵn tại `platform/docker-compose.yml` (KHÔNG sửa compose — chỉ code trong thư mục này).

## Contract SF-3 phải theo (đọc trước khi code)

- API: `contracts/openapi/users.yaml` (users + teams CRUD)
- Seed: `contracts/auth/users.json` — seed migration đọc CÙNG file với auth-mock, id khớp 100%
- Auth: JWT service-side verify theo `contracts/auth/token-contract.md` (HS256, TTL 8h, claims sub/email/roles)
- Conventions: `platform/conventions/` (multi-stage + mvnw, actuator healthcheck + /readyz, logback JSON, error envelope, port 8081, CORS dev-profile)
- Compose entry đã pre-seed với env: `SERVER_PORT`, `SPRING_DATASOURCE_URL/USERNAME/PASSWORD`, `JWT_SECRET`, `USERS_FIXTURE_PATH`, `CORS_DEV_ORIGIN`, `LOG_LEVEL`
- Boot-smoke CI job pattern: `.github/workflow-templates/services-ci.yml.example`
