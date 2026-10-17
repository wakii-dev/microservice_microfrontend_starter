# Auth Real — Implementation Plan (epic auth thật thay auth-mock)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thay auth-mock bằng auth-svc thật — register/login/refresh(rotation)/logout + RBAC demo, giữ nguyên surface `:8090 /api/auth/*`.

**Architecture:** CC archetype (wakii-playbook §2): SF-1 contracts là hiệp ước → SF-2/3/4 song song theo vùng file → SF-5 hội tụ + decommission. auth-svc mirror node-svc patterns (Fastify+TS+Drizzle, schema-only role, custom migrate runner, envelope, JWT plugin).

**Tech Stack:** Fastify 5 · TypeScript · Drizzle (Postgres) · argon2 · chi-token verify giữ HS256 · vitest/node-test.

**Spec:** `docs/superpowers/specs/2026-10-17-auth-real-design.md` — **đọc TRƯỚC**, cùng 6 decision points đã chốt.

---

### Task 1 = SF-1 (tier 0): Contracts + hiệp ước

**Files:**
- Modify: `contracts/openapi/auth.yaml` (v2 — thêm 5 endpoint)
- Modify: `contracts/auth/token-contract.md` (TTL 30m + refresh semantics + reuse-detect)
- Modify: `platform/.env.example` (+`AUTH_DEV_PASSWORD`, +`ACCESS_TOKEN_TTL=30m`)
- Modify: `platform/gateway/nginx/nginx.conf` + `platform/docker-compose.yml` — **gap-answer**, không commit đè: flag coordinator
- Test: `pnpm lint:contracts` + schemathesis CI

- [ ] **Step 1: auth.yaml thêm schemas** — `RegisterRequest{email,password(minLength 8),displayName}`, `TokenPair{accessToken,refreshToken}`, `RefreshRequest{refreshToken}`; paths `POST /register|/login|/refresh|/logout|/logout-all`; response login/register = `{user: UserRef, accessToken, refreshToken}` — **thêm `refreshToken` là additive** (UserRef đã có).
- [ ] **Step 2: mirror healthz/readyz** dưới prefix `/api/auth/` (conventions/02 rule 6 — schemathesis 404 nếu thiếu).
- [ ] **Step 3: token-contract.md v2** — access TTL `30m`; refresh: opaque 256-bit random, lưu **sha256 hash**, TTL 7d, **rotation mỗi lần dùng** (old revoked + `replaced_by`), **reuse-detect**: dùng token đã revoked → 401 + revoke cả chuỗi của user; logout/logout-all semantics; ghi rõ "RS256/JWKS = path OIDC, claims không đổi".
- [ ] **Step 4: .env.example** — `AUTH_DEV_PASSWORD=change-me-auth` + `ACCESS_TOKEN_TTL=30m` (placeholder change-me-*; JWT_SECRET dùng lại).
- [ ] **Step 5: gap-answer gateway/compose** — soạn comment đề xuất (compose entry `auth-mock` → `auth-svc`, cùng :8090, healthcheck wget `/readyz`; nginx upstream `auth-mock:8090` → `auth-svc:8090`) → **FLAG coordinator duyệt**, KHÔNG tự commit 2 file này trong SF-1.
- [ ] **Step 6: Verify** — `pnpm lint:contracts` xanh; CI `contracts` (schemathesis mirror) xanh. KHÔNG đụng code runtime.

### Task 2 = SF-2 (tier 1): auth-svc — schema + seed + 5 endpoints

**Files:**
- Create: `services/auth-svc/` (mirror cấu trúc node-svc: `src/{db/},env.ts,logger.ts,plugins/auth.ts,routes/auth.ts,app.ts,server.ts`, `drizzle/`, `Dockerfile`, `README.md`)
- Modify: `platform/postgres/init/01-init.sh` (+role `auth_svc` schema-only — gap-answer như Step 5 SF-1)

- [ ] **Step 1: khung boot** — mirror node-svc: env/logger/JWT plugin/envelope handler (`HttpError.statusCode`, pino cast — improvements-log 2026-10-12) + `/healthz` `/readyz` naked+prefix. `drizzle.config.ts` schema `auth`.
- [ ] **Step 2: migration 0000 + seed** —

```sql
CREATE TABLE IF NOT EXISTS "auth"."users" (
  "id" uuid PRIMARY KEY,
  "email" varchar(255) NOT NULL UNIQUE,
  "display_name" varchar(100) NOT NULL,
  "roles" text[] NOT NULL DEFAULT '{}',
  "password_hash" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS "auth"."refresh_tokens" (
  "id" uuid PRIMARY KEY,
  "user_id" uuid NOT NULL REFERENCES "auth"."users"("id"),
  "token_hash" text NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "revoked_at" timestamptz,
  "replaced_by" uuid,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_refresh_user ON "auth"."refresh_tokens"("user_id");
```
   Seed từ `contracts/auth/users.json`: giữ id/displayName/roles; `password_hash = argon2id(env AUTH_DEV_PASSWORD)`; **idempotent** (`ON CONFLICT (id) DO NOTHING` — seed chạy mỗi boot như spring V2).
- [ ] **Step 3: TDD rotation/reuse** (vitest, RED trước):

```ts
// refresh lần 1: old.revoked_at != null + new token hợp lệ + replaced_by=old.id
// reuse old token lần 2: 401 + TẤT CẢ refresh_tokens của user bị revoked_at != null
```
   Core SQL: `UPDATE auth.refresh_tokens SET revoked_at=now() WHERE user_id=$1 AND revoked_at IS NULL` khi reuse-detect (SELECT token_hash match trước — hash sha256, KHÔNG lưu raw).
- [ ] **Step 4: 5 endpoints** — register (argon2id hash; 409 email UNIQUE), login (verify + sign access HS256 TTL `ACCESS_TOKEN_TTL` + refresh opaque `crypto.randomBytes(32)`), refresh (rotation + reuse-detect), logout (revoke 1), logout-all (Bearer sub). Envelope mọi lỗi (conventions/04); không log password/refreshToken.
- [ ] **Step 5: Verify** — `pnpm --filter auth-svc test` (unit + integration vs postgres thật); `docker build`; boot → curl healthz/readyz + register→login→refresh→reuse→401; `docker compose ... config -q` (entry mới qua gap-answer đã duyệt).

### Task 3 = SF-3 (tier 1, song song SF-2 — vùng `services/node-svc/**`): RBAC demo

**Files:**
- Modify: `services/node-svc/src/plugins/auth.ts` (request.user đã có roles — kiểm tra decode hiện có)
- Modify: `services/node-svc/src/routes/tasks.ts` (DELETE guard)
- Test: `services/node-svc/src/app.test.ts`

- [ ] **Step 1: RED** — test: DELETE task với token roles `["user"]` → 403 envelope `{code:"FORBIDDEN"}`; alice (admin) → 200. Chạy FAIL.
- [ ] **Step 2: guard** — preHandler DELETE: `if (!user.roles?.includes('admin')) throw createError(403, 'FORBIDDEN', 'Chỉ admin được xoá task')`.
- [ ] **Step 3: GREEN** + đảm bảo e2e.sh hiện tại vẫn pass (login alice=admin ✓; bước DELETE của smoke không đổi).
- [ ] **Step 4: Verify** — `pnpm --filter node-svc test && pnpm --filter node-svc build`; commit tách biệt SF-2.

### Task 4 = SF-4 (tier 1, song song — vùng `app/shared/src/refresh-client.ts` file mới + `app/shell/**`): FE refresh wrapper

**Files:**
- Create: `app/shared/src/refresh-client.ts` + export qua `index.ts` (file mới — READ-LOCKED không đụng)
- Modify: `app/shell/src/pages/LoginPage.tsx` (+tab Register) · `app/shell/src/api.ts` (login lưu cặp)
- Test: `app/shell/tests/` (mock fetch)

- [ ] **Step 1: refresh-client API** —

```ts
export interface AuthSession { accessToken: string; refreshToken: string; }
export async function login(email: string, password: string): Promise<AuthSession>;
export async function register(email: string, password: string, displayName: string): Promise<AuthSession>;
// 401 → refresh ĐÚNG MỘT LẦN (lock promise chống thundering) → retry request
export async function withRefresh<T>(fn: (token: string) => Promise<T>): Promise<T>;
export async function logout(): Promise<void>; // revoke + clearToken
```
   Lưu refresh token: `localStorage['bp.rt']` (key mới — không đụng `bp.jwt` của token-storage).
- [ ] **Step 2: tests** — mock fetch: login lưu cặp; 401 → gọi /refresh đúng 1 lần → retry thành công; refresh cũng 401 → clear + throw Unauthorized; logout gọi endpoint + clear 2 key.
- [ ] **Step 3: LoginPage** — tab Login/Register; submit qua wrapper; lỗi 401/409 hiện đúng messages contract hiện có.
- [ ] **Step 4: Verify** — `pnpm --filter shell test && typecheck`; coverage gate ≥90 giữ nguyên (wrapper có test).

### Task 5 = SF-5 (tier 2): Convergence + decommission + docs

**Files:**
- Modify: `scripts/smoke/e2e.sh` (+bước register→refresh→reuse→401→logout→RBAC 403 bob; đánh số bước lại cẩn thận — exit-code theo bước là contract)
- Modify: `platform/docker-compose.yml` + `platform/gateway/nginx/nginx.conf` (thực thi gap-answer đã duyệt) — xoá entry auth-mock
- Modify: docs — `walkthrough.md` (login/register/refresh flow), `CLAUDE.md` (auth-mock → auth-svc :8090), `orca.yaml` (services entry mới, test_all + auth-svc), `README.md`, conventions/05 nếu env đổi
- Delete: `platform/auth-mock/`

- [ ] **Step 1: decommission** — xoá `platform/auth-mock/` + entry compose + upstream nginx (gap-answer đã duyệt); boot compose: auth-svc healthcheck xanh thay vị trí cũ.
- [ ] **Step 2: e2e mở rộng** — sau bước login: register user mới `smoke-$(date +%s)@demo.local` → refresh → **reuse old refresh → 401** → logout → DELETE task bằng token bob-qua-register (roles mặc định `["user"]`) → 403; alice DELETE → 200.
- [ ] **Step 3: docs sync CÙNG commit** (walkthrough/CLAUDE.md/orca.yaml/README) + `grep -rn "auth-mock" README.md CLAUDE.md orca.yaml docs/walkthrough.md` = rỗng.
- [ ] **Step 4: Full suite + human walkthrough** — test_all + browser: register→login→đổi tab→logout-all→session chết; security pass (0 P0/P1); evidence `docs/superpowers/evidence/auth-real/`.

---

## Ràng buộc xuyên suốt

- Contracts TRƯỚC code; drift-guard activity.yaml không đụng (đổi auth.yaml không ảnh hưởng snapshot go-svc).
- users.json: KHÔNG thêm password; UUID không đổi.
- Gateway/compose/init = shared files: SF-1 gap-answer → coordinator duyệt → SF-5 thực thi.
- Mỗi SF: evidence `docs/superpowers/evidence/auth-real/sf-N/` + `test-run.txt` ghi HEAD tại code-commit cuối; story-verify B1–B3; executor không merge — **dest → main qua PR** (git-flow).
- TDD: RED→GREEN từng behavior trên; `tdd: skipped-tdd: CI-only <lý do>` nếu môi trường không cho.
