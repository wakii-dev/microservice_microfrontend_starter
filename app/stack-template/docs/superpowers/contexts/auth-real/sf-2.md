# SF-2 Context Pack — auth-svc: schema + seed + 5 endpoints
> Epic spec: docs/superpowers/specs/2026-10-17-auth-real-design.md (rev2) · Plan Task 2: docs/superpowers/plans/2026-10-17-auth-real-plan.md · Bracket: docs/superpowers/mindmaps/auth-real.wakii · Linear: VU-61. Depends on: SF-1 (contracts đã merge — code theo auth.yaml v2 ĐÚNG rev đó).

## Spec slice
1. Service `services/auth-svc/` mirror node-svc: Fastify+TS+Drizzle, env/logger/JWT plugin (**verify issuer literal "auth-mock"** — PINNED), envelope handler (HttpError.statusCode, pino cast — improvements-log 2026-10-12), `/healthz`+`/readyz` naked+prefix. `pnpm-workspace.yaml` +`services/auth-svc` (1 dòng — shared file duy nhất SF-2 đụng, không ai khác đụng trong tier).
2. Migration 0000: 2 bảng theo spec §Kiến trúc (`roles text[] NOT NULL DEFAULT '{"user"}'`). Seed từ `contracts/auth/users.json`: giữ UUID/displayName/roles, `password_hash=argon2id(AUTH_DEV_PASSWORD)`, idempotent `ON CONFLICT (id) DO NOTHING`.
3. 5 endpoints: register (argon2id; email lowercase; 409 UNIQUE; password 8-72), login (sign HS256 TTL ACCESS_TOKEN_TTL iss "auth-mock" + refresh `crypto.randomBytes(32)`), refresh (**CAS rotation**: `UPDATE auth.refresh_tokens SET revoked_at=now(), replaced_by=$new WHERE id=$old AND revoked_at IS NULL RETURNING *` — 0 rows → reuse-detect: revoke tất cả user + 401), logout (204 idempotent), logout-all (Bearer sub). Envelope conventions/04; KHÔNG log password/refresh.
4. `.github/workflows/services-auth-svc.yml` mới từ `.github/workflow-templates/services-ci.yml.example` (path filter + permissions contents:read).
5. Local verify KHÔNG dùng compose (entry auth-svc chưa commit — SF-5 mới commit): postgres local tạo schema auth thủ công → `pnpm --filter auth-svc test` (unit + integration) → `docker build` → curl chuỗi health + register→login→refresh→reuse→401.

## Touch map (SF-2 sở hữu)
`services/auth-svc/**` (toàn bộ) · `.github/workflows/services-auth-svc.yml` (mới) · 1 dòng `pnpm-workspace.yaml` + lockfile.
READ-ONLY: `contracts/**` (SF-1), compose/nginx/init (SF-5), node/go/spring.

## ACCEPTANCE (user-visible)
- curl register→login→refresh→refresh-lại-token-cũ (401 + mọi refresh token của user chết)→logout (204, idempotent)→logout-all — chạy được đầu-cuối trên auth-svc boot local.
- 5 user fixture login được bằng AUTH_DEV_PASSWORD (alice roles admin, bob user — claims đúng từ seed).
- Workflow services-auth-svc.yml xanh trên nhánh (build + test + docker build + boot-smoke).

## Boundary (KHÔNG làm)
KHÔNG đụng node/go/spring/FE (SF-3/SF-4); KHÔNG commit compose/nginx/init (SF-5); KHÔNG đổi iss; KHÔNG đụng auth-mock (còn sống đến SF-5); RBAC (SF-3).
