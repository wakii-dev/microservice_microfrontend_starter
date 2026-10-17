# auth-svc — Auth API (Fastify + TypeScript)

Register/login/refresh(rotation)/logout của epic **auth-real (VU-59, SF-2 = VU-61)** —
thay auth-mock (JWT dev NOT-FOR-PROD) bằng auth thật, giữ nguyên surface
`:8090 /api/auth/*` để gateway/port-table/FE-flow không đổi.

Contract-first — 2 file là MỘT hiệp ước, đọc cùng nhau:
- `contracts/openapi/auth.yaml` (v2) — 5 endpoints + `GET /users` + health mirror
- `contracts/auth/token-contract.md` (v2) — TTL, rotation CAS, reuse-detect, `iss` pinned, storage FE

## Chạy native (dev — máy không Docker)

```bash
# từ repo root — pnpm workspace (auth-svc là member, NHƯNG standalone lockfile
# trong thư mục này cho Docker build — pnpm install --ignore-workspace)
pnpm install --frozen-lockfile

# cần postgres chạy sẵn — schema auth TỰ TẠO bởi migration runner lúc boot
# (SF-5 init script sẽ thêm role auth_svc; trước đó dùng user thường có CREATE):
export DATABASE_URL="postgres://boilerplate:<POSTGRES_PASSWORD>@localhost:5433/boilerplate"
export JWT_SECRET="<cùng giá trị các service verify>"
export ACCESS_TOKEN_TTL=30m                 # token-contract §1 (bắt buộc, format duration)
export AUTH_DEV_PASSWORD=demo-password      # default demo-password (decision #10)
export USERS_FIXTURE_PATH=../../contracts/auth/users.json  # thiếu = skip seed (warn)
export CORS_DEV_ORIGIN="http://localhost:3000,http://localhost:4001,http://localhost:4002"
export LOG_LEVEL=info
export PORT=8091                            # :8090 đang là auth-mock đến SF-5

pnpm --filter auth-svc dev        # tsx watch
AUTH_SVC_TEST_DATABASE_URL="$DATABASE_URL" pnpm --filter auth-svc test  # unit + integration
pnpm --filter auth-svc build      # tsc → dist/
```

Boot sequence: env fail-fast → migration (custom runner — schema `auth` tự tạo nếu
chưa có; role không có CREATE trên DB vẫn chạy được nhờ try/verify) → seed fixture
(idempotent `ON CONFLICT (id) DO NOTHING`, GIỮ UUID users.json) → listen.

## API tóm tắt (chi tiết = auth.yaml)

| Endpoint | Auth | Response |
|---|---|---|
| `POST /api/auth/register` | — | 201 `{user, accessToken, refreshToken}`; 409 email trùng |
| `POST /api/auth/login` | — | 200 same shape; 401 message chung (không lộ email tồn tại) |
| `POST /api/auth/refresh` | — | 200 `{accessToken, refreshToken}` — rotation CAS; 401 khi reuse (revoke-all user) / hết hạn / lạ |
| `POST /api/auth/logout` | — | 204 idempotent |
| `POST /api/auth/logout-all` | Bearer | 204 revoke mọi refresh của `sub` |
| `GET /api/auth/users` | — | 200 `{users:[{id,email,roles}]}` từ schema auth (giữ v1) |
| `/healthz` + `/readyz` | — | naked + mirror `/api/auth/*` (conventions/02 rule 6); readyz = SELECT 1 thật |

## Decision đáng nhớ (chi tiết trong spec + token-contract)

- **`iss` PINNED `"auth-mock"`** — 3 service + 2 CI workflow hardcode chuỗi này;
  đổi = follow-up riêng NGOÀI epic (token-contract §8). Đừng "sửa giúp".
- **Refresh**: opaque 256-bit base64url, DB chỉ lưu `sha256` hex (unique index),
  TTL 7d (constant — tầng contract). Rotation = CAS `UPDATE … WHERE id=$old AND
  revoked_at IS NULL AND expires_at > now() RETURNING` trong 1 tx với INSERT
  token mới; 0 rows = **reuse-detect → revoke TẤT CẢ** refresh của user + 401
  (strict — 2 tab refresh đồng thời cũng rơi vào đây; FE single-flight giảm xác suất).
- **argon2**: dùng `@node-rs/argon2` (napi prebuilt, có linux-x64-musl) thay
  node-argon2 native-gyp — Docker `node:22-alpine` không cần python/make/g++.
- **users.json KHÔNG chứa password** — seed hash runtime từ `AUTH_DEV_PASSWORD`;
  re-seed không đè user (`DO NOTHING`), đổi password fixture không đổi hash đã seed.

## Chạy docker

```bash
# compose entry auth-svc commit ở SF-5 — trước đó chạy tay:
docker build -t auth-svc:local services/auth-svc
docker run --rm -p 8091:8090 --network <mạng-của-postgres> \
  -e PORT=8090 \
  -e DATABASE_URL="postgres://boilerplate:...@postgres:5432/boilerplate" \
  -e JWT_SECRET=... -e ACCESS_TOKEN_TTL=30m -e AUTH_DEV_PASSWORD=demo-password \
  -e USERS_FIXTURE_PATH=/app/users.json \
  -v "$PWD/../../contracts/auth/users.json:/app/users.json:ro" \
  auth-svc:local
```

Image multi-stage (conventions/01): `node:22-alpine`, `pnpm install
--frozen-lockfile`, non-root `USER node`, EXPOSE 8090. Lockfile local
`pnpm-lock.yaml` (thư mục này) vì build context = thư mục này.

## Env vars

| Biến | Bắt buộc | Ý nghĩa |
|------|----------|---------|
| `PORT` | ✓ (default 8090) | Listen port — conventions/05 |
| `DATABASE_URL` | ✓ | Postgres — role `auth_svc` (SF-5 init) hoặc user có CREATE |
| `JWT_SECRET` | ✓ | HS256 ký access token (cùng giá trị node/spring/go verify) |
| `ACCESS_TOKEN_TTL` | ✓ | Duration (`30m`/`1800s`/`1h`) — token-contract §1 |
| `AUTH_DEV_PASSWORD` | — (default `demo-password`) | Seed hash fixture users — decision #10 |
| `USERS_FIXTURE_PATH` | — | Đường dẫn users.json; thiếu = skip seed (warn). Set mà file thiếu = fail-fast |
| `CORS_DEV_ORIGIN` | — | Origin dev được phép (phẩy) — rỗng = deny-by-default (conventions/07) |
| `LOG_LEVEL` | — | debug/info/warn/error (default info) |

## CI

`.github/workflows/services-auth-svc.yml` — 3 jobs: build-test (unit +
integration trên service container postgres:16 — rotation CAS chạy THẬT),
docker-build, boot-smoke (compose postgres + `docker run` image + mount
users.json + curl chuỗi register→login→refresh→reuse→401→logout→logout-all).
Path-filter: `services/auth-svc/**`, compose, auth.yaml, users.json.
