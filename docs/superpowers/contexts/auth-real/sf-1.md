# SF-1 Context Pack — Contracts + hiệp ước + gap-answer
> Đọc file này THAY VÌ tự tổng hợp. Epic spec: docs/superpowers/specs/2026-10-17-auth-real-design.md (rev2) · Plan Task 1: docs/superpowers/plans/2026-10-17-auth-real-plan.md · Bracket: docs/superpowers/mindmaps/auth-real.wakii · Linear: VU-60.

## Spec slice (chỉ phần SF-1 chịu trách nhiệm)
1. `contracts/openapi/auth.yaml` v2: schemas `RegisterRequest{email, password(8-72), displayName}`, `TokenPair{accessToken, refreshToken}`, `RefreshRequest`; paths `POST /register|/login|/refresh|/logout|/logout-all`; response login/register = `{user: UserRef, accessToken, refreshToken}` (DROP tokenType/expiresIn — decision #8); **giữ `GET /users`**; **xoá `/.well-known/openid-configuration`** + disclaimer header.
2. `contracts/auth/token-contract.md` v2: access TTL 30m; refresh opaque 256-bit, lưu sha256 hash, TTL 7d; rotation CAS atomic (`UPDATE ... WHERE id=$old AND revoked_at IS NULL RETURNING` — 0 rows = reuse); **reuse → revoke TẤT CẢ token user + 401 (strict)**; `iss` **PINNED "auth-mock"** (3 service + CI hardcode — đổi là follow-up riêng); `localStorage['bp.rt']` rationale (accepted-for-demo, httpOnly = upgrade path); RS256/JWKS = path OIDC.
3. `platform/.env.example`: +`AUTH_DEV_PASSWORD` default **`${AUTH_DEV_PASSWORD:-demo-password}`** (KHÔNG change-me-* — e2e/svc-activity/seed cùng nguồn), +`ACCESS_TOKEN_TTL=30m`, rename `AUTH_MOCK_PORT`→`AUTH_PORT`, `AUTH_MOCK_DEV_PASSWORD`→`AUTH_DEV_PASSWORD`.
4. `.github/workflows/contracts.yml`: schemathesis scope HẸP — chỉ paths auth-mock đang implement (paths mới sẽ 404 → job đỏ oan). Exclude register|refresh|logout đến SF-5.
5. **Gap-answer doc (8 mục, KHÔNG commit compose/nginx/init)**: ① compose entry auth-mock→auth-svc (:8090, healthcheck wget /readyz) ② key `gateway.depends_on.auth-mock`→`auth-svc` ③ nginx upstream auth-mock:8090→auth-svc:8090 ④ go-svc env `AUTH_MOCK_URL` value→`http://auth-svc:8090` ⑤ users.json volume mount cho auth-svc ⑥ init 01-init.sh + role `auth_svc`/schema `auth`/`AUTH_SVC_DB_PASSWORD` ⑦ .env renames (mục 3) ⑧ `pnpm-workspace.yaml` +`services/auth-svc`. FLAG coordinator duyệt — SF-5 thực thi.

## Touch map (SF-1 sở hữu)
`contracts/openapi/auth.yaml` · `contracts/auth/token-contract.md` · `platform/.env.example` · `.github/workflows/contracts.yml` (chỉ schemathesis scope) · gap-answer doc `docs/superpowers/contexts/auth-real/gap-answer.md`.
READ-ONLY: compose, nginx, init, pnpm-workspace (SF-5/SF-2 thực thi theo gap-answer đã duyệt).

## ACCEPTANCE (user-visible)
- `pnpm lint:contracts` xanh; CI `contracts` xanh với schemathesis SCOPED (không 404).
- token-contract.md v2 đọc được thành hiệp ước đầy đủ: TTLs, rotation CAS, reuse strict, iss pinned, bp.rt rationale — không còn câu nào nói TTL 8h / không refresh.
- Gap-answer 8 mục materialize thành file, coordinator comment APPROVED trên epic.

## Boundary (KHÔNG làm)
KHÔNG code runtime auth-svc (SF-2); KHÔNG commit compose/nginx/init/workspace (SF-5/SF-2 theo gap-answer); KHÔNG đụng node/go/spring verify code; KHÔNG đổi users.json (chỉ đọc để ghi contract).
