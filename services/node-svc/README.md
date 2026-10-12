# node-svc — task API (Fastify + TS)

> KHUNG RỖNG ở SF-1 — **SF-2 (Linear FI-70) sở hữu từ tier 1**. Điền impl vào entry compose có sẵn tại `platform/docker-compose.yml` (KHÔNG sửa compose — chỉ code trong thư mục này).

## Contract SF-2 phải theo (đọc trước khi code)

- API: `contracts/openapi/tasks.yaml` (codegen models, không gen full client)
- DB: `contracts/db/tasks-schema.sql` — canonical DDL, migration phải sinh đúng (exit: diff schema = 0)
- Conventions: `platform/conventions/` (dockerfile, healthcheck, JSON log, error envelope, port 3001, env config, CORS, gateway routing)
- Compose entry đã pre-seed với env: `PORT`, `DATABASE_URL`, `JWT_SECRET`, `SPRING_SVC_URL`, `GO_SVC_URL`, `CORS_DEV_ORIGIN`, `LOG_LEVEL`
- Boot-smoke CI job pattern: `.github/workflow-templates/services-ci.yml.example`
