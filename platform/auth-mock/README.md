# auth-mock — mock JWT service

> ⚠️ **NOT FOR PRODUCTION** — mock auth cho boilerplate demo. Token contract: `contracts/auth/token-contract.md` (source of truth). Copy dự án thật → cắm OIDC provider tại boundary này.

## Chức năng

- `POST /api/auth/login` — email trong `contracts/auth/users.json` + dev password (`AUTH_MOCK_DEV_PASSWORD`, default `demo-password`) → JWT HS256 (claims sub/email/roles/iss, TTL 8h).
- `GET /api/auth/users` — fixture users (FE login screen demo).
- `GET /api/auth/.well-known/openid-configuration` — discovery stub (không JWKS — HS256).
- `GET /api/auth/docs` — swagger UI (kể cả qua gateway: `http://localhost:8080/api/auth/docs`).
- `GET /healthz` + `/readyz` — naked path (conventions/02).

## Chạy native (dev machine không Docker)

```bash
cd platform/auth-mock
pnpm install
USERS_FIXTURE_PATH=../../contracts/auth/users.json JWT_SECRET=dev-secret-min-32-chars-long!!! pnpm start
# → http://localhost:8090/api/auth/docs
```

## Chạy qua compose (máy có Docker)

```bash
cd platform && cp .env.example .env  # điền JWT_SECRET
docker compose up -d postgres auth-mock gateway
# swagger UI qua gateway: http://localhost:8080/api/auth/docs
```

Chạy độc lập trong container: image mount users fixture từ `contracts/auth/users.json` (single source of truth — sửa fixture không cần rebuild).

## Tests

```bash
pnpm test   # node --test — không cần DB
```

## Boundary

- SF-1 sở hữu. SF-3 (spring-svc) KHÔNG sửa service này — chỉ đọc cùng fixture file.
- Password là **mock-only** (một dev password chung, không hash) — lý do số 1 service này không được đem ra production.
