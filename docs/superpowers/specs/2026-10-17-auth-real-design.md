# Spec: Epic Auth thật thay auth-mock

Ngày: 2026-10-17 · Trạng thái: APPROVED (user duyệt design trong chat cùng ngày) ·
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
| 4 | Refresh mechanism | **Opaque + rotation + revoke** (bảng refresh_tokens, hash sha256) | JWT pair |
| 5 | FE READ-LOCKED | **Wrapper `refresh-client.ts` file mới** — token-storage.ts API đã đủ (`setToken/clearToken/readClaims/isExpired`), không đụng file locked | sửa token-storage.ts |
| 6 | Ngôn ngữ | **Node Fastify + TS + Drizzle** (mirror node-svc: schema-only role, custom migrate runner, envelope, JWT plugin; argon2 npm) | Go + chi |

Token claims `sub/email/roles` **giữ nguyên shape** (token-contract.md đã ghi: nâng cấp
không đổi claims), HS256 giữ nguyên — RS256/JWKS là path OIDC sau này. Access TTL
**8h → 30m**; token cũ vẫn verify trong giai đoạn chuyển (same claims).

## Kiến trúc

```
auth-svc (mới, :8090 /api/auth/*)
  schema auth (role auth_svc — schema-only, custom migrate runner như node-svc):
    users          (id UUID PK ← fixture UUID GIỮ NGUYÊN, email UNIQUE,
                    display_name, roles text[], password_hash argon2id, created_at)
    refresh_tokens (id uuid PK, user_id FK → auth.users, token_hash sha256,
                    expires_at, revoked_at NULL, replaced_by uuid NULL, created_at)
```

- **Seed**: từ `contracts/auth/users.json` — alice/bob/carol/svc-activity/svc-fail giữ
  nguyên UUID + displayName + roles; password = env `AUTH_DEV_PASSWORD` chung (precedent
  `AUTH_MOCK_DEV_PASSWORD`). **users.json KHÔNG thêm password** (contract sạch, gitleaks).
- **spring-svc giữ users table của nó** cho demo @Transactional — 2 bảng cùng UUID từ
  fixture, không sync runtime (documented; roles source-of-truth = token claims).
- **svc-activity** (go-svc service-token) login đúng flow cũ; **svc-fail** saga không đổi.

## API (contracts/openapi/auth.yaml v2 — SF-1)

| Endpoint | Body | Response / Note |
|---|---|---|
| `POST /api/auth/register` | {email, password(min 8), displayName} | 201 `{user, accessToken, refreshToken}`; 409 email trùng |
| `POST /api/auth/login` | {email, password} | 200 same shape; 401 sai thông tin |
| `POST /api/auth/refresh` | {refreshToken} | 200 cặp mới — **rotation**: cũ revoked + `replaced_by`; reuse token đã rotate → 401 + revoke cả chuỗi |
| `POST /api/auth/logout` | {refreshToken} | 204 revoke 1 token |
| `POST /api/auth/logout-all` | (Bearer) | 204 revoke tất cả của `sub` |
| `GET /healthz` + `/readyz` | — | mirror naked + prefix (conventions/02 rule 6) |

Error envelope conventions/04. Password + refresh-token KHÔNG BAO GIỜ log
(conventions/03; security pass SF-5).

**RBAC demo:** node-svc `DELETE /api/tasks/:id` yêu cầu roles chứa `admin` — alice admin
(e2e hiện tại giữ pass), bob → 403 (assert thêm). Gateway vẫn chỉ presence-check —
enforcement 2 lớp đúng conventions.

**FE (SF-4):** `app/shared/src/refresh-client.ts` (file MỚI): login lưu cặp token;
401 → refresh một-lần → retry; logout gọi endpoint + clear. `token-storage.ts`
READ-LOCKED không đổi. LoginPage thêm form Register (tab).

## Tương thích chuyển tiếp

- Login response **thêm `refreshToken`** — additive, `e2e.sh` đọc `accessToken` không đổi.
- auth-mock **decommission ở SF-5**: compose entry `auth-mock` → `auth-svc` (đổi build +
  tên container, giữ :8090); gateway upstream đổi tên service theo — **gateway + compose
  là shared files → gap-answer SF-1** qua coordinator (protocol playbook IN/CC).
- Users.json UUID cố định không đổi → saga fail-user + seed spring + node validate không vỡ.

## SF tier bracket (story mode — 5 SF)

| SF | Tier | Nội dung | Gate chính |
|---|---|---|---|
| SF-1 | 0 | auth.yaml v2 + token-contract.md v2 + gateway/compose gap-answer + env (`AUTH_DEV_PASSWORD`, `ACCESS_TOKEN_TTL`) | spectral + schemathesis |
| SF-2 | 1 | auth-svc: schema auth + migrate + seed + 5 endpoints + argon2id + rotation/reuse-detect + unit/integration | boot-smoke + tests xanh |
| SF-3 | 1 | node-svc RBAC DELETE admin-only + 403 tests (song song SF-2 — khác vùng file) | node suite + e2e hiện tại |
| SF-4 | 1 | FE refresh-client + LoginPage register tab + auto-refresh (song song — vùng app/shared file mới + app/shell) | shell suite + a11y |
| SF-5 | 2 | convergence: e2e mở rộng register→login→refresh→reuse-detect→logout→RBAC 403; decommission auth-mock; docs sync (walkthrough, CLAUDE.md, orca.yaml, README, conventions/05 nếu env); security pass | e2e + human walkthrough |

## Điều kiện chấp nhận (epic DONE)

1. `pnpm lint:contracts` xanh; schemathesis auth.yaml PASS (mirror paths).
2. auth-svc: register→login→refresh→refresh(lại token cũ)→401-và-chuỗi-revoked; logout-all
   thật sự hết hiệu lực — integration test chứng minh từng bước.
3. e2e 2 chiều hiện tại PASS không sửa (compat), bản mở rộng PASS (SF-5).
4. DELETE task bằng bob → 403 envelope; alice → 200 (e2e assert).
5. FE: refresh token hết hạn access → tự refresh không thấy 401 trên UI; logout-all kill
   session mọi tab (test shell chứng minh qua mock).
6. auth-mock không còn trong compose; `docker compose up` boot auth-svc healthcheck xanh.
7. Security pass: 0 P0/P1 (password/refresh không log, argon2id, rotation, reuse-detect).
8. Docs sync: walkthrough mục login + CLAUDE.md (auth-mock → auth-svc) + orca.yaml
   (services entry) cùng commit SF-5.

## Non-goals

OAuth/OIDC (RS256/JWKS — path ghi sẵn token-contract.md), password reset qua email,
rate-limit distributed, multi-tenant, đổi claims shape, migration user data thật.
