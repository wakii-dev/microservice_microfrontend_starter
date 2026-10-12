# SF-1 Context Pack — Contracts & Platform Foundation
> Đọc file này THAY VÌ tự tổng hợp từ bracket + epic + comments.
> Epic spec: `docs/superpowers/specs/2026-10-12-boilerplate-microservice-mfe.md` (rev 3). Bracket: `docs/superpowers/mindmaps/micro-boilerplate.wakii`.

## Spec slice (chỉ phần SF-1 chịu trách nhiệm)
1. Tạo `contracts/openapi/`: `tasks.yaml`, `users.yaml`, `activity.yaml`, `auth.yaml` — source of truth API. `activity.yaml` PHẢI có `POST /activity/events` (payload: taskId, userId, action, timestamp) và feed response chứa user-display fields (userName, taskTitle) — FE không tự bịa placeholder. spectral rules + schemathesis scaffold chạy trong CI.
2. `contracts/db/tasks-schema.sql` — canonical DDL bảng `tasks` (node-svc migration phải sinh đúng; go-svc query theo). Đây là interface thật giữa SF-2/SF-4.
3. `contracts/auth/users.json` — fixture users chung (id, email, roles). auth-mock đọc file này; SF-3 seed cũng đọc.
4. `contracts/auth/token-contract.md` — JWT HS256; claims: sub (= user id spring), email, roles; TTL 8h; secret chia qua compose env; enforcement 2 lớp (gateway chặn thiếu-token 401 + service tự verify signature/expiry).
5. `platform/conventions/`: Dockerfile multi-stage pattern; healthcheck `/healthz` (liveness) + `/readyz` (readiness); JSON log shape chung; error envelope chung; PORT TABLE đủ (node-svc 3001, spring 8081, go 8082, auth-mock, postgres 5432, gateway 8080, shell + 2 remotes dev ports); env config qua env-var; CORS dev-profile rule.
6. Gateway routing table: `/` → shell, `/remotes/*` → remote static, `/api/*` → services. Remote registry: tên MF remote (`tasks`, `activity`) + URL dev/prod, env-configurable.
7. `platform/docker-compose.yml` PRE-SEED ĐỦ khung: node-svc, spring-svc, go-svc, postgres, nginx gateway, auth-mock. `.env.example` commit với env inventory ĐẦY ĐỦ; `.env` ignore. **SF-2/3/4 KHÔNG được sửa compose — chỉ điền impl vào entry có sẵn.**
8. Postgres init script: tạo schemas (tasks/users/activity), user roles riêng per service, readonly role go-svc với **`ALTER DEFAULT PRIVILEGES IN SCHEMA tasks`** (grant hiệu lực khi bảng sinh sau bởi migration SF-2).
9. `platform/gateway/nginx/` config theo routing table + JWT presence check.
10. `platform/auth-mock/` — service nhỏ cấp JWT theo token contract, đọc users fixture, có discovery stub OIDC-ready, disclaimer rõ KHÔNG-PRODUCTION.
11. `frontend/shared/` (fe-shared): api client wrapper (đính JWT, error envelope decode), MF bootstrap helper, token storage; pnpm-workspace.yaml globs đủ `frontend/*`. **Spike bắt buộc: hello-world host + remote load được qua @module-federation/enhanced trên Rspack, pin version thực tế đã test** (React 19 + MF + Rspack là cặp rủi ro — pin phải có căn cứ, không bịa).
12. `.gitignore`, `.gitattributes` (`* text=auto eol=lf` — Windows dev machine), `.editorconfig`.
13. `.github/workflows/` templates: path-filtered per service; **boot-smoke job pattern** (container up + curl `/healthz` + `/readyz` + migration chạy xong); gitleaks; contract lint + schemathesis.
14. README.md cập nhật: kiến trúc thật (Mermaid) + cách chạy từng phần + port table.

## Touch map (files SF-1 tạo/sở hữu)
```
contracts/openapi/{tasks,users,activity,auth}.yaml      [SỞ HỮU]
contracts/db/tasks-schema.sql                            [SỞ HỮU]
contracts/auth/{users.json,token-contract.md}            [SỞ HỮU]
platform/conventions/*                                   [SỞ HỮU]
platform/docker-compose.yml + .env.example               [SỞ HỮU — SF khác READ-ONLY]
platform/gateway/nginx/*                                 [SỞ HỮU]
platform/auth-mock/*                                     [SỞ HỮU]
frontend/shared/* + pnpm-workspace.yaml                  [SỞ HỮU — SF-5/6 READ-ONLY]
.gitignore .gitattributes .editorconfig                  [SỞ HỮU]
.github/workflows/*                                      [SỞ HỮU]
README.md                                                [SỬA — file hiện hữu duy nhất]
services/node-svc|spring-svc|go-svc/                     [CHỈ tạo khung rỗng + entry compose; KHÔNG code impl]
```

## ACCEPTANCE (user-visible)
- `docker compose config` validate được compose đầy đủ 6 services (CI-verified — dev machine KHÔNG có docker, KHÔNG thử compose up local).
- CI: spectral lint contracts pass; schemathesis scaffold chạy; gitleaks pass; boot-smoke của auth-mock xanh (container up + healthz).
- Mở swagger UI auth-mock qua gateway → login bằng fixture user → nhận JWT hợp lệ theo token contract (verify được claims + TTL).
- fe-shared spike: hello-world remote load được trong host trên Rspack — pin versions ghi vào `frontend/shared/package.json` + note spike.
- README hiển thị kiến trúc Mermaid khớp cây thư mục thật.

## Boundary (KHÔNG làm)
- KHÔNG implement business logic của node/spring/go (SF-2/3/4) — chỉ khung compose + entry rỗng.
- KHÔNG tạo FE shell/remotes (SF-5/6) — chỉ fe-shared + workspace globs.
- KHÔNG scaffold script (SF-7). KHÔNG sửa `services/*/` impl code sau khi SF-2/3/4 chiếm (sau tier 1, platform/* vẫn của SF-1).
- Docker local không tồn tại — mọi verify docker qua CI; KHÔNG retry `docker compose up` trên dev machine.
