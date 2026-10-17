# Token Contract — auth-svc (HS256 + refresh rotation) — v2

> SF-1 (VU-60) sở hữu. Hiệp ước của epic auth-real (VU-59): mọi SF sau (SF-2 auth-svc,
> SF-3 RBAC, SF-4 FE refresh-client, SF-5 convergence) code THEO file này + `contracts/openapi/auth.yaml` v2.
> Chuyển tiếp: auth-mock chạy song song đến SF-5 decommission với hành vi v1 của nó —
> từ SF-2 mọi implementation/test bám target dưới đây.

## 1. Access token — JWT HS256, TTL 30m

- **Algorithm**: HS256 (HMAC-SHA256) — symmetric, một secret chung (`JWT_SECRET`, §5).
- **Header**:

```json
{ "alg": "HS256", "typ": "JWT" }
```

- **Payload (claims)** — shape giữ nguyên so với v1:

| Claim  | Kiểu      | Bắt buộc | Ý nghĩa |
|--------|-----------|----------|---------|
| `sub`  | string    | ✓        | **User id (UUID)** — primary key `auth.users` của auth-svc; seeded users giữ nguyên UUID fixture `contracts/auth/users.json`. node-svc lấy đây làm `created_by`/`assignee_id`. |
| `email`| string    | ✓        | Email (lowercase-normalized) |
| `roles`| string[]  | ✓        | Vd `["admin"]`, `["user"]` — mirror `auth.users.roles`; source-of-truth cho RBAC (SF-3) |
| `iss`  | string    | ✓        | **PINNED `"auth-mock"`** — ⚠️ giá trị lịch sử CỐ Ý giữ nguyên: node-svc + spring-svc + go-svc verify và 2 CI workflow hardcode chuỗi này; đổi chuỗi = follow-up nhỏ RIÊNG (ngoài epic này), KHÔNG đổi trong auth-svc |
| `iat`  | int (epoch giây) | ✓ | Thời điểm cấp |
| `exp`  | int (epoch giây) | ✓ | `iat + 1800` |

- **TTL: 30 phút = 1800 giây** — cấu hình env `ACCESS_TOKEN_TTL=30m` (auth-svc đọc; token hết hạn → FE auto-refresh, §4).

## 2. Refresh token — opaque 256-bit, TTL 7d

- **Opaque, không phải JWT**: `crypto.randomBytes(32)` (256-bit entropy) → base64url. Client nhận raw, không parse được gì.
- **Server chỉ lưu hash `sha256(refresh_token)`** — DB không bao giờ chứa raw; leak DB không dựng lại token được. So khớp bằng hash lookup.
- **TTL: 7 ngày** — `expires_at = created_at + 7d`; hết hạn → 401 ở `/refresh`.
- **FE storage: `localStorage['bp.rt']`** (key mới, tách khỏi `token-storage.ts` READ-LOCKED).
  **Rationale — accepted-for-demo**: localStorage đọc được qua XSS = rủi ro đã cân nhắc và CHẤP NHẬN cho scope demo của boilerplate (security pass epic ghi nhận ở acceptance #7). httpOnly-cookie + CSRF protection = **upgrade path** ghi ở §8; không mở lại tranh luận trong epic này.

## 3. Rotation CAS atomic + reuse-detect (strict)

Mỗi `POST /api/auth/refresh`: sinh refresh token mới TRƯỚC, rồi CAS (compare-and-set) atomic trên row cũ:

```sql
UPDATE auth.refresh_tokens
SET revoked_at = now(), replaced_by = $new_id
WHERE id = $old_id AND revoked_at IS NULL
RETURNING id;
```

- **RETURNING ≥ 1 row** → thắng CAS: trả cặp mới (accessToken 30m + refreshToken mới 7d). Token cũ đã revoked, `replaced_by` trỏ token mới.
- **RETURNING 0 rows** → **reuse-detect** (token đã dùng / đã revoke / không tồn tại):
  revoke **TẤT CẢ** refresh token của user + trả **401** envelope `UNAUTHORIZED`:

  ```sql
  UPDATE auth.refresh_tokens
  SET revoked_at = now()
  WHERE user_id = $sub AND revoked_at IS NULL;
  ```

  **Strict by design** — token bị replay = kẻ tấn công chiếm được → mất toàn bộ session của user đó an toàn hơn cho phép token cũ còn dùng (chain-only revoke). User chỉ cần login lại.
- **2 tab refresh đồng thời**: request thua CAS bị coi reuse → 401. Chấp nhận strict; FE dùng **single-flight promise lock** (SF-4) giảm xác suất — documented, không claim cross-tab realtime.

## 4. Flows + endpoints (shape v2)

| Endpoint | Request | Response |
|---|---|---|
| `POST /api/auth/register` | `{email, password(8–72), displayName}` | **201** `AuthSession {user, accessToken, refreshToken}`; 409 `CONFLICT` email trùng |
| `POST /api/auth/login` | `{email, password}` | **200** `AuthSession` như trên; 401 `UNAUTHORIZED` |
| `POST /api/auth/refresh` | `{refreshToken}` | **200** `TokenPair {accessToken, refreshToken}` (rotation CAS §3); 401 khi reuse/hết hạn |
| `POST /api/auth/logout` | `{refreshToken}` | **204** — **idempotent**: token lạ/đã revoke vẫn 204 (không leak tồn tại) |
| `POST /api/auth/logout-all` | Bearer (không body) | **204** — revoke tất cả refresh của `sub`; access còn hạn tự chết ở lần refresh kế |
| `GET /api/auth/users` | — | **200** danh sách user demo — auth-svc serve từ schema `auth` (giữ endpoint v1) |

- **Register**: roles gán `["user"]`; email normalize lowercase trước lưu/lookup; password 8–72 ký tự (argon2 input limit), hash **argon2id**.
- **FE flow (SF-4)**: login/register → lưu cặp (access → `tokenStorage`, refresh → `localStorage['bp.rt']`); 401 từ API → refresh **đúng một lần** (single-flight) → retry; logout → gọi endpoint + clear cả 2 key.
- **Lỗi**: envelope conventions/04 — `VALIDATION_ERROR` 400 · `UNAUTHORIZED` 401 · `CONFLICT` 409.

## 5. Secrets + env phân phối

- `JWT_SECRET` — auth-svc **ký**, node-svc/spring-svc/go-svc **verify**. Compose inject cùng một giá trị; không commit (`.env` gitignored).
- `AUTH_DEV_PASSWORD` *(rename từ `AUTH_MOCK_DEV_PASSWORD` — compose tham chiếu swap ở SF-5, gap-answer ⑦)* — dev password của **seeded fixture users**: seed tạo `password_hash = argon2id(AUTH_DEV_PASSWORD)`. Default **`demo-password` KHÔNG ĐỔI** — e2e + go-svc (`svc-activity` login) + seed cùng một nguồn. `users.json` KHÔNG thêm password — chỉ `$comment` mapping.
- `ACCESS_TOKEN_TTL=30m` — auth-svc đọc (§1).
- Seed idempotent `ON CONFLICT (id) DO NOTHING` — UUID fixture giữ nguyên.

## 6. Enforcement 2 lớp (bất biến — giữ nguyên v1)

| Lớp | Ai | Kiểm tra gì | Fail |
|-----|----|-------------|------|
| 1 — Presence | nginx gateway | Header `Authorization: Bearer ...` có tồn tại trên `/api/tasks`, `/api/users`, `/api/activity` | `401` ngay tại gateway. `/api/auth`, `/`, `/remotes/*` KHÔNG bị chặn |
| 2 — Verify | Từng service (node/spring/go) | Tự verify **signature (HS256 với JWT_SECRET) + expiry (`exp`) + `iss`** (giá trị pinned §1). KHÔNG tin kết luận của gateway | `401` error envelope `{code: "UNAUTHORIZED"}` |

Nguyên tắc: gateway là tiện ích giảm noise, **không phải biên bảo mật**. RBAC (roles) là việc của service — SF-3 demo qua node-svc `DELETE` admin-only; gateway chỉ presence-check.

## 7. Ví dụ payload

```json
{
  "sub": "11111111-1111-4111-8111-111111111111",
  "email": "alice@demo.local",
  "roles": ["admin"],
  "iss": "auth-mock",
  "iat": 1728700000,
  "exp": 1728701800
}
```

## 8. Upgrade paths (ngoài scope epic này)

- **RS256/JWKS + OIDC thật**: chuyển sign/verify sang asymmetric + expose `/.well-known/openid-configuration` thật (v2 DROP discovery stub v1 — không ai consume). Claims `sub/email/roles` giữ nguyên để FE/services không đổi.
- **httpOnly-cookie** cho refresh token (thay `localStorage['bp.rt']`) + CSRF protection.
- **Đổi chuỗi `iss`** thành `"auth-svc"` — follow-up nhỏ riêng: 3 constants service + 2 CI workflows, làm khi có SF chạm cả 3 vùng.
