# Auth Real — Implementation Plan (epic auth thật thay auth-mock) — rev 2

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thay auth-mock bằng auth-svc thật — register/login/refresh(rotation CAS)/logout + RBAC demo, giữ nguyên surface `:8090 /api/auth/*`.

**Architecture:** CC archetype (wakii-playbook §2): SF-1 contracts là hiệp ước → SF-2/3/4 song song theo vùng file → SF-5 hội tụ + decommission + **CI swap**. auth-svc mirror node-svc patterns.

**Tech Stack:** Fastify 5 · TypeScript · Drizzle (Postgres) · argon2 · HS256 verify giữ nguyên (`iss` **PINNED `"auth-mock"`** — đổi = follow-up riêng) · vitest/node-test.

**Spec:** `docs/superpowers/specs/2026-10-17-auth-real-design.md` **rev 2** — ĐỌC TRƯỚC: 10 decision points (7-10 thêm từ spec-critic + plan-critic: iss pinned, response shape v2, giữ GET /users drop openid, password default demo-password).

---

### Task 1 = SF-1 (tier 0): Contracts + hiệp ước + gap-answer ĐẦY ĐỦ

**Files:**
- Modify: `contracts/openapi/auth.yaml` (v2 — 5 endpoint mới + giữ `GET /users` + **xoá `/.well-known/openid-configuration`** + response shape v2)
- Modify: `contracts/auth/token-contract.md` (v2 — chi tiết dưới)
- Modify: `platform/.env.example` (+`AUTH_DEV_PASSWORD` default **`demo-password`** theo pattern `${VAR:-demo-password}`; +`ACCESS_TOKEN_TTL=30m`; **rename `AUTH_MOCK_PORT`→`AUTH_PORT`, `AUTH_MOCK_DEV_PASSWORD`→`AUTH_DEV_PASSWORD`**)
- Modify: `.github/workflows/contracts.yml` — **schemathesis scope hẹp lại**: chỉ chạy paths auth-mock đang implement (paths mới thêm sẽ 404 → job đỏ oan). Exclude `register|refresh|logout` khỏi include-path đến SF-5
- Prepare (KHÔNG commit — gap-answer doc cho coordinator duyệt, SF-5 thực thi): compose entry `auth-mock`→`auth-svc` + key `gateway.depends_on.auth-mock`→`auth-svc` + nginx upstream + go-svc env `AUTH_MOCK_URL` value → `http://auth-svc:8090` + users.json volume mount cho auth-svc + init 01-init.sh thêm role `auth_svc`/schema `auth` + `AUTH_SVC_DB_PASSWORD`

- [ ] **Step 1: auth.yaml** — schemas `RegisterRequest{email,password(minLength 8,maxLength 72),displayName}`, `TokenPair{accessToken,refreshToken}`, `RefreshRequest{refreshToken}`; paths `POST /register|/login|/refresh|/logout|/logout-all`; **response login/register = `{user: UserRef, accessToken, refreshToken}` — DROP `tokenType`/`expiresIn` (decision #8, KHÔNG thuần additive)**; `GET /users` giữ (description: serve từ schema auth); xoá discovery stub + cập nhật disclaimer header.
- [ ] **Step 2: mirror healthz/readyz** dưới prefix `/api/auth/` (conventions/02 rule 6).
- [ ] **Step 3: token-contract.md v2** — access TTL `30m`; refresh: opaque 256-bit, **lưu sha256 hash**, TTL **7d**, rotation **CAS atomic** (`UPDATE ... WHERE id=$old AND revoked_at IS NULL RETURNING` — 0 rows = reuse), **reuse → revoke TẤT CẢ refresh_tokens của user + 401** (strict; FE single-flight giảm xác suất — documented); `iss` **PINNED `"auth-mock"`** (3 service + CI hardcode — đổi tên là follow-up riêng); `localStorage['bp.rt']` rationale pin (accepted-for-demo, httpOnly-cookie = upgrade path); ghi "RS256/JWKS = path OIDC, claims không đổi".
- [ ] **Step 4: .env.example** — như Files ở trên (default `demo-password` — KHÔNG `change-me-*`: e2e + svc-activity + seed cùng một nguồn, acceptance #3 phụ thuộc).
- [ ] **Step 5: soạn gap-answer doc đầy đủ** (list ở Files — 8 mục) → FLAG coordinator duyệt. KHÔNG commit compose/nginx/init trong SF-1.
- [ ] **Step 6: Verify** — `pnpm lint:contracts` xanh; CI `contracts` xanh với schemathesis SCOPED (verify job không 404).

### Task 2 = SF-2 (tier 1, song song — vùng `services/auth-svc/**` mới + 2 shared files 1 dòng): auth-svc

**Files:**
- Create: `services/auth-svc/` (mirror node-svc: src/{db,plugins,routes}, drizzle/, Dockerfile, README, `.github/workflows/services-auth-svc.yml` từ workflow-templates)
- Modify: `pnpm-workspace.yaml` (+`- "services/auth-svc"` — 1 dòng, SF-3/SF-4 không đụng file này → an toàn song song)
- Modify: `pnpm-lock.yaml` (install sinh)

- [x] **Step 1: khung boot** — mirror node-svc: env/logger/JWT plugin (**verify issuer giữ literal `"auth-mock"`**)/envelope (HttpError.statusCode, pino cast) + `/healthz` `/readyz` naked+prefix. `drizzle.config.ts` schema `auth`.
- [x] **Step 2: migration 0000 + seed** — SQL như spec §Kiến trúc (`roles text[] NOT NULL DEFAULT '{"user"}'`); seed từ users.json giữ UUID, `password_hash = argon2id(AUTH_DEV_PASSWORD)`, idempotent `ON CONFLICT (id) DO NOTHING`.
- [x] **Step 3: TDD rotation/reuse (RED trước)** —

```ts
// refresh lần 1 (CAS): old.revoked_at != null + cặp mới + replaced_by=old.id
// 2 request CAS cùng old id: 1 thắng, 1 về 0-rows → reuse-detect
// reuse old sau rotate: 401 + TẤT CẢ refresh_tokens user bị revoked_at != null
// logout trên token đã revoked: 204 (idempotent)
```
   Rotation query: `UPDATE auth.refresh_tokens SET revoked_at=now(), replaced_by=$new WHERE id=$old AND revoked_at IS NULL RETURNING *` — 0 rows → reuse-detect: `UPDATE ... SET revoked_at=now() WHERE user_id=$u AND revoked_at IS NULL` + 401. Hash sha256, KHÔNG lưu raw.
- [x] **Step 4: 5 endpoints** — register (argon2id; email lowercase-normalize; 409 UNIQUE; password 8–72), login (sign HS256 TTL `ACCESS_TOKEN_TTL`, iss `"auth-mock"`, + refresh `crypto.randomBytes(32)`), refresh (CAS + reuse-detect), logout (204 idempotent), logout-all (Bearer sub). Envelope conventions/04; không log password/refreshToken.
- [x] **Step 5: Verify** — `pnpm --filter auth-svc test` 37/37 (27 unit + 10 integration postgres thật, XANH trên DB fresh ×2 — executor + reviewer tự chạy); `docker build` OK; boot-smoke chuỗi register→refresh→reuse→401→logout PASS **trên image**. ⚠️ "Workflow xanh trên nhánh": GitHub Actions **disabled repo-wide** (`gh api …/actions/permissions → enabled:false`, 10/10 workflows `disabled_manually` — không push nào fire CI) → chứng minh = 3 jobs chạy tương đương local; coordinator enable Actions (hoặc để SF-5 CI swap) → re-run để có run xanh thật. Chi tiết `docs/superpowers/evidence/sf-2-auth-real/test-run.txt`.

### Task 3 = SF-3 (tier 1, song song — vùng `services/node-svc/**`): RBAC demo

**Files:**
- Modify: `services/node-svc/src/plugins/auth.ts` (verify request.user có roles — decode hiện có)
- Modify: `services/node-svc/src/routes/tasks.ts` (DELETE guard)
- Test: `services/node-svc/src/app.test.ts`

- [ ] **Step 1: RED** — test DELETE với token roles `["user"]` → 403 `{code:"FORBIDDEN"}`; alice (admin) → 200. Chạy FAIL.
- [ ] **Step 2: guard** — preHandler DELETE: `if (!user.roles?.includes('admin')) throw createError(403, 'FORBIDDEN', 'Chỉ admin được xoá task')`.
- [ ] **Step 3: GREEN** — suite node xanh (e2e.sh hiện tại KHÔNG có bước DELETE — compat mặc nhiên đúng, không cần assert gì thêm ở SF-3).
- [ ] **Step 4: Verify** — `pnpm --filter node-svc test && pnpm --filter node-svc build`.

*(SF-3 nhỏ hơn chuẩn 8-15 steps — giữ riêng vì vùng file tách bạch là trục song song với SF-2/4; chạy tier co-giãn Standard.)*

### Task 4 = SF-4 (tier 1, song song — vùng `app/shared/src/refresh-client.ts` mới + `app/shell/**`): FE refresh wrapper

**Files:**
- Create: `app/shared/src/refresh-client.ts` + export qua `index.ts`
- Modify: `app/shell/src/pages/LoginPage.tsx` (+tab Register; response v2 shape — không còn tokenType/expiresIn) · `app/shell/src/api.ts`
- Test: `app/shell/tests/` (mock fetch)

- [ ] **Step 1: refresh-client API** —

```ts
export interface AuthSession { accessToken: string; refreshToken: string; }
export async function login(email: string, password: string): Promise<AuthSession>;
export async function register(email: string, password: string, displayName: string): Promise<AuthSession>;
// 401 → refresh ĐÚNG MỘT LẦN (single-flight promise lock) → retry
export async function withRefresh<T>(fn: (token: string) => Promise<T>): Promise<T>;
export async function logout(): Promise<void>; // revoke + clear 2 key
```
   Access → `tokenStorage` (API có sẵn); refresh → `localStorage['bp.rt']` (rationale pin token-contract.md).
- [ ] **Step 2: tests** — mock fetch: login/register lưu cặp đúng key; 401 → /refresh đúng 1 lần → retry OK; refresh cũng 401 → clear 2 key + throw Unauthorized; logout revoke + clear.
- [ ] **Step 3: LoginPage** — tab Login/Register; response v2 shape; lỗi 401/409 theo messages contract.
- [ ] **Step 4: Verify** — `pnpm --filter shell test && typecheck`; **coverage gate đúng ngưỡng config (lines/statements/branches 90, functions 80)**; **a11y test** (tab/form mới phải qua suite a11y sẵn có).

### Task 5 = SF-5 (tier 2): Convergence + decommission + CI swap + docs

**Files:**
- Modify: `scripts/smoke/e2e.sh` (+bước auth-real: register→refresh→reuse→401→logout; đánh số lại — **bảo toàn contract: exit N = fail bước N (<255), marker `SAGA_TASK_ID=`, `SMOKE_SAGA=0` vẫn exit 0**)
- Modify: `platform/docker-compose.yml` + `platform/gateway/nginx/nginx.conf` + `platform/postgres/init/01-init.sh` + go-svc env — **thực thi gap-answer SF-1 đã duyệt** (8 mục)
- Modify: `.github/workflows/contracts.yml` (boot auth-svc thay auth-mock; nới schemathesis full) + `services-go-svc.yml` + `services-spring-svc.yml` (boot auth-svc)
- Modify: docs — `walkthrough.md` (+register/refresh flow + gotcha `down -v` + sync "số bước PASS"), `CLAUDE.md` (auth-mock → auth-svc), `orca.yaml` (services entry auth-svc + gotcha down-v + test_all + auth-svc), `README.md`, `docs/toolchain.md`
- Delete: `platform/auth-mock/`
- Modify: `platform/.env.example` (đồng bộ rename đã làm ở SF-1 — nếu conflict thì merge)

- [ ] **Step 1: decommission** — xoá `platform/auth-mock/` + entry compose (kèm `depends_on` key) + upstream nginx + go-svc env value; boot compose (volume MỚI hoặc `down -v`): auth-svc healthcheck xanh thay vị trí cũ.
- [ ] **Step 2: e2e mở rộng** — sau login: register `smoke-<ts>@demo.local` → refresh → reuse old → 401 → logout → register user roles `["user"]` DELETE task → 403; alice DELETE → 200.
- [ ] **Step 3: CI swap** — 3 workflow boot auth-svc; contracts.yml nới schemathesis full paths; **toàn bộ CI main phải xanh sau merge** (acceptance #9).
- [ ] **Step 4: docs sync CÙNG commit** — list ở Files; grep `auth-mock` = rỗng trên: docs/*.md, CLAUDE.md, orca.yaml, README.md, .env.example, .github/workflows/ (token-contract.md + users.json $comment giữ note lịch sử nếu muốn — ghi rõ).
- [ ] **Step 5: Full suite + security pass + human walkthrough 2 tab** (register→login→tab 2→logout-all→tab 1 chết ở request kế tiếp) — evidence `docs/superpowers/evidence/auth-real/`.

---

## Ràng buộc xuyên suốt (rev 2)

- Contracts TRƯỚC code; `iss` **PINNED `"auth-mock"`** — mọi verify/serving giữ nguyên giá trị; drift-guard activity.yaml không liên quan.
- users.json: KHÔNG thêm password; UUID không đổi; `$comment` ghi mapping password → `AUTH_DEV_PASSWORD` (update $comment thuộc SF-5 docs).
- Gateway/compose/init/workspace/CI = shared files: SF-1 soạn gap-answer → coordinator duyệt → SF thực thi đúng mục sở hữu; KHÔNG 2 SF cùng đụng 1 shared file trong 1 tier.
- Mỗi SF: evidence `docs/superpowers/evidence/auth-real/sf-N/` + test-run.txt ghi HEAD tại code-commit cuối; story-verify B1–B3; executor không merge — dest → main qua PR (git-flow).
- TDD: RED→GREEN từng behavior; `tdd: skipped-tdd: CI-only <lý do>` nếu cần.
