# Gap-answer — 8 mục đổi shared files (epic auth-real VU-59)

> Soạn bởi SF-1 (VU-60) theo context pack `sf-1.md` mục "Gap-answer doc (8 mục)".
> Trạng thái: **PROPOSAL — chờ coordinator APPROVED-reply trên epic VU-59** trước khi
> SF thực thi. SF-1 KHÔNG commit compose/nginx/init/workspace (boundary).
> Mỗi mục ghi: file đích · giá trị HIỆN TẠI (đọc từ main 2026-10-17) → GIÁ TRỊ ĐÍCH ·
> SF thực thi · lý do. Tất cả anchor đã grep-verify trên tree SF-1.

## ① Compose entry `auth-mock` → `auth-svc`

**File:** `platform/docker-compose.yml` (block `auth-mock:` — dòng 75–94 hiện tại)

Đổi key service `auth-mock:` → `auth-svc:` + nội dung entry:

```yaml
  auth-svc:
    build: ../services/auth-svc        # ← đổi từ ./auth-mock (service mới ở services/)
    environment:
      PORT: 8090 # container port CỐ ĐỊNH (conventions/05) — giữ nguyên surface :8090
      DATABASE_URL: postgres://auth_svc:${AUTH_SVC_DB_PASSWORD:?set in .env}@postgres:5432/${POSTGRES_DB:?set in .env}
      JWT_SECRET: ${JWT_SECRET:?set in .env}
      ACCESS_TOKEN_TTL: ${ACCESS_TOKEN_TTL:-30m}     # token-contract.md §1
      AUTH_DEV_PASSWORD: ${AUTH_DEV_PASSWORD:-demo-password}   # decision #10
      USERS_FIXTURE_PATH: /app/users.json
      CORS_DEV_ORIGIN: ${CORS_DEV_ORIGIN:-}
      LOG_LEVEL: ${LOG_LEVEL:-info}
    volumes:
      - ../contracts/auth/users.json:/app/users.json:ro   # ← mục ⑤
    ports:
      - "${AUTH_PORT:-8090}:8090"                          # ← mục ⑦
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      # wget /readyz (KHÔNG /healthz như auth-mock cũ) — readyz auth-svc kiểm DB
      # thật (spec v2: "không hardcode 200") → service_healthy = đã migrate+seed.
      test: ["CMD", "wget", "-qO-", "http://127.0.0.1:8090/readyz"]
      interval: 5s
      timeout: 3s
      retries: 12
      start_period: 20s   # chờ migration + seed fixture lúc boot
```

**SF thực thi:** SF-5 (decommission — xoá entry `auth-mock` + `platform/auth-mock/` cùng commit).
**Lý do:** giữ surface `:8090 /api/auth/*` (decision #2) — gateway/port-table/FE-flow không đổi.

## ② Key `gateway.depends_on.auth-mock` → `auth-svc`

**File:** `platform/docker-compose.yml` (dòng 102–104 hiện tại)

```yaml
    depends_on:
      auth-svc:            # ← đổi từ auth-mock
        condition: service_healthy
```

**SF thực thi:** SF-5 (cùng commit với ① — cùng file).
**Lý do:** gateway gate trên service_healthy; healthcheck auth-svc dùng `/readyz` (kiểm DB)
→ gateway chỉ nhận traffic khi auth-svc đã migrate + seed xong.

## ③ nginx upstream `auth-mock:8090` → `auth-svc:8090`

**File:** `platform/gateway/nginx/nginx.conf` (dòng 100–102 hiện tại)

```nginx
        # ---------- API: auth → auth-svc (MỞ — entry login + register + swagger) ----------
        location /api/auth {
            set $up http://auth-svc:8090;   # ← đổi từ http://auth-mock:8090
```

**SF thực thi:** SF-5.
**Lý do:** pass-through giữ nguyên (conventions/08); chỉ hostname upstream đổi theo tên
service compose mới. Route rules + presence-check `/api/tasks|/api/users|/api/activity`
KHÔNG đổi.

## ④ go-svc env `AUTH_MOCK_URL` — đổi VALUE, giữ KEY

**File:** `platform/docker-compose.yml` (entry `go-svc`, dòng 186 hiện tại)

```yaml
      AUTH_MOCK_URL: http://auth-svc:8090   # ← chỉ đổi VALUE từ http://auth-mock:8090
```

**SF thực thi:** SF-5.
**Lý do:** KEY giữ nguyên `AUTH_MOCK_URL` — go-svc đọc env này ở
`services/go-svc/internal/config/config.go:42` (`getenv("AUTH_MOCK_URL")`); đổi key =
sửa code go-svc (ngoài phạm vi gap-answer, không SF nào được brief sửa go-svc trừ
verify-code). Value-only swap = zero code change, zero risk cho go-svc.
**⚠️ Note cho follow-up:** `config.go:67` hardcode default `http://auth-mock:8090` khi
env unset — compose + CI luôn set env nên không lộ runtime; default stale này gom vào
follow-up "đổi tên auth-mock" cùng cụm iss-rename (spec decision #7).

## ⑤ Volume mount `users.json` cho auth-svc

**File:** `platform/docker-compose.yml` — đã embed trong entry ở mục ①; tách riêng để
review rõ:

```yaml
    volumes:
      - ../contracts/auth/users.json:/app/users.json:ro
    environment:
      USERS_FIXTURE_PATH: /app/users.json
```

**SF thực thi:** SF-5 (đi kèm ①).
**Lý do:** auth-svc seed idempotent từ fixture GIỮ UUID (`ON CONFLICT (id) DO NOTHING`,
token-contract.md §5) — mount trực tiếp từ `contracts/` như auth-mock cũ: sửa fixture
không cần rebuild image. `GET /users` serve từ DB (schema `auth`), KHÔNG đọc fixture
mỗi request.

## ⑥ Init script + role `auth_svc` / schema `auth` / `AUTH_SVC_DB_PASSWORD`

**File 1:** `platform/postgres/init/01-init.sh` — thêm block sau block role go_readonly:

```sql
CREATE SCHEMA IF NOT EXISTS auth;
CREATE ROLE auth_svc   LOGIN PASSWORD '${AUTH_SVC_DB_PASSWORD}';
GRANT USAGE, CREATE ON SCHEMA auth TO auth_svc;
ALTER ROLE auth_svc SET search_path = auth;
```

**File 2:** `platform/docker-compose.yml` — entry `postgres.environment` thêm 1 dòng
(cạnh GO_READONLY_DB_PASSWORD, dòng 35 hiện tại):

```yaml
      AUTH_SVC_DB_PASSWORD: ${AUTH_SVC_DB_PASSWORD:?set in .env}
```

**File 3:** `platform/.env.example` — thêm 1 dòng vào block Postgres:

```
AUTH_SVC_DB_PASSWORD=change-me-auth
```

**SF thực thi:** SF-5 (cả 3 file; `.env.example` SF-5 đồng bộ cùng commit theo plan Task 5).
**Lý do:** auth-svc owns schema `auth` riêng (decision #3 — pattern per-service schema +
LOGIN role như 3 service cũ); init chỉ chạy trên volume MỚI → **gotcha: volume postgres cũ
phải `docker compose down -v` 1 lần** (epic acceptance #6 — gotcha vào orca.yaml +
walkthrough ở SF-5 docs sync).

## ⑦ `.env` renames (phần compose-side)

**Đã xong bởi SF-1** (commit này): `platform/.env.example` — `AUTH_MOCK_PORT=8090` →
`AUTH_PORT=8090`; `AUTH_MOCK_DEV_PASSWORD=demo-password` → `AUTH_DEV_PASSWORD=demo-password`
(+ comment nguồn chung e2e/svc-activity/seed); **+ `ACCESS_TOKEN_TTL=30m`**.

**Phần compose-side — SF-5 thực thi** (cùng commit ①):

| Vị trí trong compose (hiện tại) | Đổi thành |
|---|---|
| `ports: - "${AUTH_MOCK_PORT:-8090}:8090"` (dòng 88) | `"${AUTH_PORT:-8090}:8090"` |
| `AUTH_MOCK_DEV_PASSWORD: ${AUTH_MOCK_DEV_PASSWORD:-demo-password}` (dòng 81) | `AUTH_DEV_PASSWORD: ${AUTH_DEV_PASSWORD:-demo-password}` (decision #10 — default `demo-password` KHÔNG đổi) |
| comment dòng 78/90 nhắc `${AUTH_MOCK_PORT}` | nhắc `${AUTH_PORT}` |

**Lý do:** decision #10 — `${AUTH_DEV_PASSWORD:-demo-password}` (KHÔNG `change-me-*`):
e2e + go-svc svc-activity + seed cùng một nguồn, acceptance epic #3 phụ thuộc.
`SVC_ACTIVITY_PASSWORD=demo-password` trong `.env.example` KHÔNG đổi (đã khớp nguồn chung).

## ⑧ `pnpm-workspace.yaml` + `services/auth-svc`

**File:** `pnpm-workspace.yaml` — thêm 1 dòng vào block `packages:`, cạnh
`- "services/node-svc"` (dòng cuối block hiện tại):

```yaml
  # auth-svc (SF-2 epic VU-59 điền impl) — standalone lockfile như node-svc
  - "services/auth-svc"
```

**SF thực thi:** SF-2 (plan Task 2 — Files: Modify `pnpm-workspace.yaml`; SF-2 là SF duy
nhất đụng file này trong tier 1 → an toàn song song).
**Lý do:** auth-svc là workspace member (mirror node-svc); install bằng
`pnpm install --frozen-lockfile --ignore-workspace` trong thư mục service đến khi vào
workspace chính thức (gotcha CLAUDE.md).

---

## Tóm tắt ma trận thực thi

| Mục | File | SF thực thi |
|---|---|---|
| ① compose entry | `platform/docker-compose.yml` | SF-5 |
| ② depends_on key | `platform/docker-compose.yml` | SF-5 |
| ③ nginx upstream | `platform/gateway/nginx/nginx.conf` | SF-5 |
| ④ go-svc env value | `platform/docker-compose.yml` | SF-5 |
| ⑤ users.json mount | `platform/docker-compose.yml` | SF-5 |
| ⑥ init + role + env password | `platform/postgres/init/01-init.sh` + compose + `.env.example` | SF-5 |
| ⑦ .env renames | `.env.example` (SF-1 **đã xong**) + compose refs (SF-5) | SF-1 ✓ / SF-5 |
| ⑧ workspace line | `pnpm-workspace.yaml` | SF-2 |

Không mục nào cho 2 SF đụng cùng 1 shared file trong 1 tier (ràng buộc plan rev2).
