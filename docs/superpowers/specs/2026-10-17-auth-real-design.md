# Spec: Epic Auth thật thay auth-mock

Ngày: 2026-10-17 · Trạng thái: **rev 2** — spec-critic + plan-critic FIX-P0 đã xử (PR #13) ·
Archetype: **CC — Cross-cutting contract** (wakii-playbook §2) · Story epic đầu tiên áp dụng playbook.

## Bối cảnh

auth-mock là JWT HS256 NOT-FOR-PROD: password dev chung, không refresh, không register,
không revoke. Là điểm yếu #1 khi scaffold boilerplate sang project thật (CLAUDE.md đánh giá
2026-10-17). Epic này thay bằng service auth thật, giữ nguyên surface `/api/auth/*` :8090
để gateway/port-table/FE-flow không đổi.

## Quyết định đã chốt (user, chat 2026-10-17)

| # | Quyết định | Chọn | Không chọn |
|---|---|---|---|
| 1 | Scope MVP | **Full MVP**: register + login + refresh (rotation) + RBAC demo + decommission auth-mock | login-only; không-refresh |
| 2 | Port + path | **auth-svc đón :8090 `/api/auth/*`** — gateway/env/README không đổi, port 4-chỗ không kích hoạt | port mới :8091 song song |
| 3 | Users schema | **auth-svc owns schema `auth` riêng** (users + refresh_tokens), seed từ users.json GIỮ UUID | spring owns; gộp vào spring |
| 4 | Refresh mechanism | **Opaque + rotation + revoke** — CAS atomic, reuse → revoke **toàn bộ token của user** (strict) | JWT pair; chain-only revoke |
| 5 | FE READ-LOCKED | **Wrapper `refresh-client.ts` file mới** — token-storage.ts API đã đủ | sửa token-storage.ts |
| 6 | Ngôn ngữ | **Node Fastify + TS + Drizzle** (mirror node-svc) | Go + chi |
| 7 | *(rev 2)* **`iss` claim** | **PIN `iss: "auth-mock"`** — 3 service + 2 CI workflows hardcode giá trị này; đổi tên = rework 3 vùng + rework CI. Follow-up nhỏ riêng (đổi 3 constant + workflows) khi có SF chạm cả 3 vùng | đổi thành "auth-svc"; env-ify ngay trong epic |
| 8 | *(rev 2)* **Response shape v2** | `{user, accessToken, refreshToken}` — **drop `tokenType`/`expiresIn`** (e2e chỉ cần accessToken); FE SF-4 cập nhật theo | giữ tokenType/expiresIn |
| 9 | *(rev 2)* **auth.yaml v1 paths** | **Giữ `GET /users`** (FE demo picker — auth-svc serve từ schema auth); **drop `/.well-known/openid-configuration`** (không ai consume; path OIDC ghi token-contract) | giữ cả 2 |
| 10 | *(rev 2)* **Password compat** | `AUTH_DEV_PASSWORD` default **`demo-password`** (`${AUTH_DEV_PASSWORD:-demo-password}`) — e2e + svc-activity + fixture seed cùng một nguồn | default `change-me-auth` |

Token claims `sub/email/roles` giữ nguyên shape; HS256 giữ nguyên. Access TTL **8h → 30m**;
token cũ cùng `iss` vẫn verify trong chuyển tiếp. Refresh TTL **7d** (tầng contract).

## Kiến trúc

```
auth-svc (mới, :8090 /api/auth/* — workspace member, standalone lockfile như node-svc)
  schema auth (role auth_svc — schema-only, custom migrate runner như node-svc):
    users          (id UUID PK ← fixture UUID GIỮ NGUYÊN, email UNIQUE lowercase-normalized,
                    display_name, roles text[] NOT NULL DEFAULT '{"user"}',
                    password_hash argon2id, created_at)
    refresh_tokens (id uuid PK, user_id FK, token_hash sha256, expires_at,
                    revoked_at NULL, replaced_by uuid NULL, created_at)
```

- **Seed**: từ `contracts/auth/users.json` — giữ nguyên UUID + displayName + roles;
  password = `AUTH_DEV_PASSWORD` (default demo-password); **users.json KHÔNG thêm password**;
  idempotent `ON CONFLICT (id) DO NOTHING`.
- **Rotation atomic (CAS)**: `UPDATE auth.refresh_tokens SET revoked_at=now(), replaced_by=$new
  WHERE id=$old AND revoked_at IS NULL RETURNING` — 0 rows = **reuse-detect** → revoke tất cả
  refresh_tokens của user + 401. 2 tab refresh đồng thời: request thua CAS điReuse-detect
  (chấp nhận strict — FE single-flight lock giảm xác suất; documented).
- **spring-svc giữ users table của nó** cho demo @Transactional — cùng UUID từ fixture,
  không sync runtime (roles source-of-truth = token claims).
- **svc-activity** (go-svc) login đúng flow cũ, password = cùng `AUTH_DEV_PASSWORD`
  (users.json $comment đã ghi pattern này).
- **Register**: roles gán `["user"]`; email normalize lowercase trước lưu/lookup;
  password 8–72 ký tự (argon2 input limit).

## API (contracts/openapi/auth.yaml v2 — SF-1)

| Endpoint | Body | Response / Note |
|---|---|---|
| `POST /api/auth/register` | {email, password(8–72), displayName} | 201 `{user, accessToken, refreshToken}`; 409 email trùng |
| `POST /api/auth/login` | {email, password} | 200 same shape; 401 sai thông tin |
| `POST /api/auth/refresh` | {refreshToken} | 200 cặp mới (CAS rotation); reuse → 401 + revoke-all |
| `POST /api/auth/logout` | {refreshToken} | 204 — **idempotent** (token đã revoked vẫn 204) |
| `POST /api/auth/logout-all` | (Bearer) | 204 revoke tất cả của `sub` |
| `GET /api/auth/users` | — | **giữ v1** — danh sách user demo (auth-svc serve từ schema auth) |
| `GET /healthz` + `/readyz` | — | mirror naked + prefix (conventions/02 rule 6) |
| ~~`/.well-known/openid-configuration`~~ | — | **drop** (không ai consume; path OIDC ở token-contract.md) |

**RBAC demo:** node-svc `DELETE /api/tasks/:id` yêu cầu roles chứa `admin` — alice admin
(e2e hiện tại giữ pass), bob → 403 (assert thêm). Gateway vẫn chỉ presence-check.

**FE (SF-4):** `app/shared/src/refresh-client.ts` (file MỚI): login/register lưu cặp
(access → tokenStorage; refresh → `localStorage['bp.rt']` — key mới, rationale pin vào
token-contract.md v2 để security-pass không mở lại); 401 → refresh single-flight đúng
một lần → retry; logout gọi endpoint + clear 2 key. `token-storage.ts` READ-LOCKED không đổi.

## CI ownership (rev 2 — P0 spec-critic + plan-critic)

| File | SF sở hữu | Thay đổi |
|---|---|---|
| `.github/workflows/contracts.yml` | **SF-1** | schemathesis scope hẹp lại (chỉ paths auth-mock đã implement — mới thêm sẽ 404); **SF-5**: boot auth-svc thay auth-mock + bỏ assert `"iss"` nếu cần |
| `.github/workflows/services-auth-svc.yml` | **SF-2 (tạo mới)** | từ workflow-templates: build + test + docker build + boot-smoke |
| `.github/workflows/services-node-svc.yml` | — không đổi | test payload `iss: "auth-mock"` — vẫn đúng (iss pinned) |
| `.github/workflows/services-go-svc.yml` + `services-spring-svc.yml` | **SF-5** | boot auth-svc thay auth-mock (tên container) |

Chấp thuận gates: `iss` pinned → node workflow payload không đổi ✓.

## SF tier bracket (story mode — 5 SF)

| SF | Tier | Nội dung | Gate chính |
|---|---|---|---|
| SF-1 | 0 | auth.yaml v2 + token-contract.md v2 (iss pinned, TTLs, rotation/CAS/reuse, bp.rt rationale) + gap-answer ĐẦY ĐỦ (compose entry + depends_on key + nginx upstream + go-svc `AUTH_MOCK_URL` value + users.json mount + init role `auth_svc` + .env rename AUTH_MOCK_* + workspace line + **contracts.yml schemathesis scope**) | spectral + schemathesis scoped |
| SF-2 | 1 | auth-svc: schema + seed + 5 endpoints + CAS rotation + reuse-detect + **services-auth-svc.yml workflow** | workflow mới xanh + tests |
| SF-3 | 1 | node-svc RBAC DELETE admin-only + 403 tests | node suite |
| SF-4 | 1 | FE refresh-client + LoginPage register tab + auto-refresh + a11y | shell suite + coverage gate (90/90/80/90) + a11y |
| SF-5 | 2 | convergence: e2e mở rộng + decommission (thực thi gap-answer: compose/nginx/go-env/users-mount/init/.env renames) + **CI swap 3 workflows** + docs sync rộng (walkthrough, CLAUDE.md, orca.yaml, README, toolchain, gotcha `down -v`) + security pass | e2e + CI toàn main xanh + human walkthrough |

## Điều kiện chấp nhận (epic DONE)

1. `pnpm lint:contracts` xanh; schemathesis auth.yaml PASS (scoped SF-1, full SF-5).
2. auth-svc: register→login→refresh→reuse-old→401+revoke-all; logout idempotent 204;
   logout-all hết hiệu lực — integration test chứng minh từng bước.
3. e2e 2 chiều hiện tại PASS không sửa (login đọc `accessToken` ✓; password default
   demo-password ✓; iss pinned ✓).
4. DELETE task bằng bob → 403 envelope; alice → 200 (unit SF-3 + e2e SF-5).
5. FE: access hết hạn → auto-refresh đúng 1 lần không 401 UI; logout-all → **các tab khác
   chết ở request kế tiếp (401 → refresh fail → về login)** — verify qua human walkthrough
   2 tab (không claim cross-tab realtime).
6. compose boot auth-svc healthcheck xanh; **volume postgres cũ cần `down -v` 1 lần
   (gotcha mới vào orca.yaml + walkthrough)**.
7. Security pass 0 P0/P1: argon2id, rotation CAS, reuse-detect, không log password/refresh,
   **localStorage `bp.rt` = accepted-for-demo (rationale pin trong token-contract.md —
   httpOnly-cookie là upgrade path ghi rõ)**.
8. Docs sync rộng: walkthrough + CLAUDE.md + orca.yaml + README + toolchain + `.env.example`
   (rename AUTH_MOCK_*) + grep `auth-mock` = rỗng trên docs + `.env.example` + workflows
   (token-contract/users.json giữ histórico tên trong $comment nếu cần).
9. *(rev 2)* **CI toàn main xanh sau SF-5 merge** (contracts/go/spring swap auth-svc boot).

## Non-goals

OAuth/OIDC (RS256/JWKS — path token-contract.md), password reset qua email, rate-limit
distributed, multi-tenant, đổi claims shape, **đổi `iss` string (follow-up riêng)**,
httpOnly-cookie storage (upgrade path ghi token-contract.md).
