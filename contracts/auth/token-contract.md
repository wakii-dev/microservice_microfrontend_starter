# Token Contract — JWT HS256 (mock auth)

> SF-1 (FI-64) sở hữu. ⚠️ **NOT FOR PRODUCTION** — mock JWT cho boilerplate demo; dự án thật copy boilerplate sẽ cắm OIDC provider thật (Keycloak/Auth0) tại auth-mock boundary.

## 1. Token format

- **Algorithm**: HS256 (HMAC-SHA256) — symmetric, một secret chung.
- **Header**:

```json
{ "alg": "HS256", "typ": "JWT" }
```

- **Payload (claims)**:

| Claim  | Kiểu      | Bắt buộc | Ý nghĩa |
|--------|-----------|----------|---------|
| `sub`  | string    | ✓        | **User id = UUID trong `contracts/auth/users.json`** = primary key user của spring-svc (SF-3 seed cùng fixture). node-svc lấy đây làm `created_by`/`assignee_id`. |
| `email`| string    | ✓        | Email fixture user |
| `roles`| string[]  | ✓        | Vd `["admin"]`, `["user"]` — mirror trường roles trong fixture |
| `iss`  | string    | ✓        | Luôn `"auth-mock"` |
| `iat`  | int (epoch giây) | ✓ | Thời điểm cấp |
| `exp`  | int (epoch giây) | ✓ | `iat + 28800` |

- **TTL: 8 giờ = 28800 giây**. Không refresh token (mock).

## 2. Secret phân phối

- Secret nằm trong env var `JWT_SECRET` — **không commit** (chỉ có trong `.env`, đã gitignore; `.env.example` chứa placeholder).
- Compose inject **cùng một giá trị** cho: `auth-mock` (ký), `node-svc`, `spring-svc`, `go-svc` (verify).
- **Gateway nginx KHÔNG giữ secret** — gateway chỉ kiểm tra *presence* của header (xem §4).
- Dev generation: `openssl rand -base64 48` hoặc bất kỳ chuỗi ≥ 32 ký tự.

## 3. Login flow (mock)

```
POST /api/auth/login  { "email": "alice@demo.local", "password": "<AUTH_MOCK_DEV_PASSWORD>" }
→ 200 { accessToken, tokenType: "Bearer", expiresIn: 28800 }
```

- Email phải có trong `contracts/auth/users.json` — claims sinh từ đúng entry fixture đó.
- **Password mock-only**: một dev password chung, cấu hình qua env `AUTH_MOCK_DEV_PASSWORD` (default `demo-password`, có thể override trong `.env`). Đây là lý do service này là mock — không có hash, không có user credential thật.

## 4. Enforcement 2 lớp (bắt buộc với MỌI service)

| Lớp | Ai | Kiểm tra gì | Fail |
|-----|----|-------------|------|
| 1 — Presence | nginx gateway | Header `Authorization: Bearer ...` có tồn tại trên `/api/tasks`, `/api/users`, `/api/activity` | `401` ngay tại gateway. `/api/auth`, `/`, `/remotes/*` KHÔNG bị chặn |
| 2 — Verify | Từng service (node/spring/go) | Tự verify **signature (HS256 với JWT_SECRET) + expiry (`exp`) + `iss`**. KHÔNG tin kết luận của gateway | `401` error envelope `{code: "UNAUTHORIZED"}` |

Nguyên tắc: gateway là tiện ích giảm noise, **không phải biên bảo mật**. Service nào thấy token sai signature / hết hạn → tự từ chối 401, không phụ thuộc gateway.

## 5. Ví dụ payload

```json
{
  "sub": "11111111-1111-4111-8111-111111111111",
  "email": "alice@demo.local",
  "roles": ["admin"],
  "iss": "auth-mock",
  "iat": 1728700000,
  "exp": 1728728800
}
```

## 6. Điểm cắm OIDC (cho lần copy thật)

- auth-mock expose `GET /api/auth/.well-known/openid-configuration` — discovery stub tĩnh (issuer + token_endpoint). Không có JWKS vì HS256 symmetric.
- Khi thay bằng OIDC thật: đổi discovery metadata trỏ tới provider thật, chuyển service verify sang RS256/JWKS — token contract claims (sub/email/roles) giữ nguyên để FE/services không đổi.
