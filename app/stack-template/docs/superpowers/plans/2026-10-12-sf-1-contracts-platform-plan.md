# Plan — SF-1 Contracts & Platform Foundation (FI-64)

> Story FI-62 · spec: `docs/superpowers/specs/2026-10-12-boilerplate-microservice-mfe.md` rev 3 · slice: `docs/superpowers/contexts/sf-1.md`
> Worktree: `__STACK_ORG__/sf-1-contracts-platform` (fork từ `__STACK_ORG__/story-fi62-micro-boilerplate`) · merge target: nhánh story (coordinator merge)
> Tier: Full (16 tasks) · Ràng buộc: dev machine KHÔNG Docker — verify docker qua CI; Java/Go không local

## Key design decisions (contract-level — các SF sau fork từ đây)

1. **Gateway pass-through, không rewrite prefix**: mọi service mount route dưới `/api/<svc>/...` khớp chính xác `servers.url` trong OpenAPI spec. nginx chỉ proxy + chặn thiếu-token (401) cho `/api/tasks|users|activity`; `/api/auth`, `/`, `/remotes/*` mở.
2. **auth-mock = Fastify (Node 22)** — chạy native được trên dev machine (browser-verify swagger UI local), Dockerfile multi-stage cho CI/boot-smoke.
3. **Spike MF** tại `frontend/spike/{host,remote}` — build + chạy thật trên Rspack, pin version = version đã test thật (ghi vào `frontend/shared/package.json` + `frontend/spike/README.md`).
4. **Port table** (conventions + compose + README khớp nhau): gateway 8080, shell 3000, remote-tasks 4001, remote-activity 4002, node-svc 3001, spring-svc 8081, go-svc 8082, auth-mock 8090, postgres 5432.
5. **Canonical DDL**: schema `tasks`, bảng `tasks` — `assignee_id`/`created_by` là uuid KHÔNG FK chéo schema (users thuộc schema `users` của spring-svc; validate qua REST).
6. **Readonly grant**: `ALTER DEFAULT PRIVILEGES FOR ROLE node_svc IN SCHEMA tasks GRANT SELECT ON TABLES TO go_readonly` — hiệu lực cho bảng sinh sau bởi migration SF-2.
7. **Users fixture**: `{id, email, roles}` — auth-mock đọc runtime; spring seed (SF-3) đọc cùng file. Login mock: email + dev password qua env `AUTH_MOCK_DEV_PASSWORD` (default ghi rõ trong token-contract, mock-only).
8. **CI**: active cho contracts + auth-mock (spectral, schemathesis scaffold, gitleaks, compose config, boot-smoke auth-mock); CI per-service để TEMPLATE cho SF-2/3/4 (chưa bật — services chưa có code).

## Tasks

- [x] Task 1 — Repo hygiene: `.gitignore` (node_modules, .env, dist, target, build…), `.gitattributes` (`* text=auto eol=lf`), `.editorconfig`
- [x] Task 2 — pnpm workspace root: `pnpm-workspace.yaml` (globs `frontend/*`, `frontend/spike/*`, `services/node-svc`), root `package.json`, `packageManager` pin
- [x] Task 3 — `contracts/openapi/tasks.yaml`: Task schema khớp canonical DDL; CRUD `/api/tasks`; error envelope responses
- [x] Task 4 — `contracts/openapi/users.yaml`: `/api/users` + `/api/teams` (spring-svc surface, đủ cho node-svc validate user)
- [x] Task 5 — `contracts/openapi/activity.yaml`: `POST /api/activity/events` (taskId, userId, action, timestamp) + feed response CHỨA user-display fields (userName, taskTitle) + stats
- [x] Task 6 — `contracts/openapi/auth.yaml`: `/api/auth/login`, discovery stub, fixture users list; `.spectral.yaml` ruleset
- [x] Task 7 — `contracts/db/tasks-schema.sql` canonical DDL (schema `tasks`, indexes, comment lý do không FK chéo schema)
- [x] Task 8 — `contracts/auth/users.json` fixture + `contracts/auth/token-contract.md` (HS256, claims sub/email/roles, TTL 8h, secret phân phối, enforcement 2 lớp)
- [x] Task 9 — `platform/conventions/`: dockerfile-pattern.md, healthcheck.md, logging.md (JSON shape), error-envelope.md, ports.md (port table), configuration.md (env-var rule), cors.md (dev-profile rule), gateway-routing.md (routing table + remote registry)
- [x] Task 10 — `platform/docker-compose.yml` PRE-SEED 6 services (postgres, auth-mock, gateway, node-svc, spring-svc, go-svc) + `platform/.env.example` inventory ĐẦY ĐỦ + `platform/postgres/init/01-schemas.sql` (schemas + per-service roles + `ALTER DEFAULT PRIVILEGES`)
- [x] Task 11 — `platform/gateway/nginx/`: nginx.conf theo routing table + JWT presence check (`/api/tasks|users|activity` thiếu Authorization → 401)
- [x] Task 12 — `platform/auth-mock/`: Fastify service đọc users fixture, cấp JWT theo token contract, `/healthz` `/readyz`, swagger UI `/docs`, discovery stub, disclaimer NOT-FOR-PRODUCTION, tests (node:test), Dockerfile multi-stage
- [x] Task 13 — `frontend/shared/`: api client wrapper (đính JWT + decode error envelope), token storage, MF bootstrap helper, package.json pin versions; `frontend/spike/`: host + remote hello-world trên Rspack + @module-federation/enhanced — CHẠY THẬT local, ghi kết quả pin
- [x] Task 14 — Services khung rỗng: `services/node-svc|spring-svc|go-svc/.gitkeep` + README-placeholder (SF-2/3/4 điền impl); KHÔNG code impl
- [x] Task 15 — CI: `.github/workflows/contracts.yml` (spectral + compose config + gitleaks + boot-smoke auth-mock + schemathesis scaffold) + `.github/workflows/services-ci-template.yml` (template path-filtered + boot-smoke cho SF-2/3/4)
- [x] Task 16 — README.md: Mermaid kiến trúc thật khớp cây thư mục + cách chạy từng phần + port table

## Verification (exit criteria)

1. CI xanh trên nhánh `__STACK_ORG__/sf-1-contracts-platform`: spectral pass, compose config validate, gitleaks pass, boot-smoke auth-mock xanh, schemathesis scaffold chạy.
2. Từng dòng ACCEPTANCE trong `docs/superpowers/contexts/sf-1.md` kiểm riêng (Phase 5).
3. auth-mock: chạy native local → curl login nhận JWT decode đúng claims + TTL 8h; swagger UI mở được bằng mắt (browser verify).
4. Spike MF: host load remote hello-world thật (evidence: build output + screenshot/log).
5. Code-reviewer độc lập trên diff SF → APPROVED (comment Linear có VERDICT APPROVED + CHECKLIST-4Q).
6. `~/.claude/bin/story-verify sf-1` không FAIL/VIOLATION.
