# Fresh-clone walkthrough — từ clone đến demo chạy được

Checklist cho người MỚI copy boilerplate. Mọi lệnh dưới đây là những gì đã chạy thật trong SF-7 (evidence: `docs/superpowers/evidence/sf-7-convergence/test-run.txt`).

## 0. Toolchain cần có

Đọc [toolchain.md](toolchain.md). Tóm tắt: Node 22 + pnpm 9 (corepack) + JDK 21 + Go 1.24 + bash/curl. Docker TÙY CHỌN (không có vẫn xong được — chọn đường A hoặc B bên dưới).

## 1. Clone + cài đặt

```bash
git clone <repo> && cd <repo>
pnpm install --frozen-lockfile     # FE workspace (frontend/*)
cd services/node-svc && pnpm install --frozen-lockfile --ignore-workspace && cd ../..   # node-svc standalone lockfile
cd platform/auth-mock && pnpm install --ignore-workspace && cd ../..                     # auth-mock standalone
```

## 2. Postgres + seed

Cần Postgres 16 chạy sẵn với init script của platform (schemas + roles + readonly grants):

- **Có Docker (dễ nhất):** `cd platform && cp .env.example .env` (điền mật khẩu) → `docker compose up -d postgres` — init script `platform/postgres/init/01-init.sh` tự chạy lần đầu.
- **Không Docker:** cài/portable Postgres 16, `initdb` một data dir rồi chạy nội dung `platform/postgres/init/01-init.sh` tay (tạo db `boilerplate`, roles `node_svc`/`spring_svc`/`go_svc`/`go_readonly` với mật khẩu khớp .env, schemas + default privileges).

## 3. Chọn đường chạy demo

### Đường A — Compose (có Docker — khuyến nghị)

```bash
cd platform
cp .env.example .env                # điền JWT_SECRET (openssl rand -base64 48) + passwords
docker compose up -d --build        # health-gated chain tự đợi đúng thứ tự
bash ../scripts/smoke/e2e.sh        # từ platform/ — script ở repo root (PASS = chuỗi login→task→feed qua :8080)
# Mở browser: http://localhost:8080/ → login alice@demo.local / demo-password
```

### Đường B — Native (không Docker — từng service một)

```bash
# 4 service BE — mỗi lệnh 1 terminal, env theo .env.example (placeholder dev):
cd platform/auth-mock && JWT_SECRET=<dev-secret> PORT=8090 \
  USERS_FIXTURE_PATH=$(pwd)/../../contracts/auth/users.json \
  AUTH_MOCK_DEV_PASSWORD=demo-password node src/server.js

cd services/spring-svc && SPRING_DATASOURCE_URL="jdbc:postgresql://localhost:5432/boilerplate" \
  SPRING_DATASOURCE_USERNAME=spring_svc SPRING_DATASOURCE_PASSWORD=<pw> \
  JWT_SECRET=<dev-secret> SERVER_PORT=8081 USERS_FIXTURE_PATH=$(pwd)/../../contracts/auth/users.json \
  ./mvnw spring-boot:run        # Windows: ./mvnw.cmd

cd services/node-svc && JWT_SECRET=<dev-secret> PORT=3001 \
  DATABASE_URL="postgres://node_svc:<pw>@localhost:5432/boilerplate" \
  SPRING_SVC_URL=http://localhost:8081 GO_SVC_URL=http://localhost:8082 pnpm dev

cd services/go-svc && JWT_SECRET=<dev-secret> PORT=8082 \
  DATABASE_URL="postgres://go_svc:<pw>@localhost:5432/boilerplate" \
  DATABASE_READONLY_URL="postgres://<owner-user>:<owner-pw>@localhost:5432/boilerplate" \
  SPRING_SVC_URL=http://localhost:8081 go run ./cmd/server

# FE (3 terminal):
cd frontend/shell   && pnpm dev   # :3000
cd frontend/remotes/tasks    && pnpm dev   # :4001
cd frontend/remotes/activity && pnpm dev   # :4002
```

Native mode KHÔNG có nginx gateway — FE gọi thẳng service port theo conventions/07 (CORS dev đã mở). Chain 3 service "qua một cổng" là đặc tính của compose mode (đường A) + CI e2e-smoke job.

### Verify chain bằng smoke script (cả hai đường)

Script gọi qua prefix `/api/<svc>` (giống gateway routing — conventions/08):
- Đường A (từ repo root, không cd platform): `bash scripts/smoke/e2e.sh` (mặc định `GATEWAY_URL=http://localhost:8080`).
- Đường B: không có gateway thật — chứng minh chain bằng cách gọi service trực tiếp, hoặc dựng proxy mapping `/api/*` (SF-7 dùng mini Node proxy cục bộ khi verify native — KHÔNG commit vì chỉ phục vụ verify).

## 4. Browser walkthrough (human gate — KHÔNG trong CI)

Trên máy có stack sống (đường A hoặc B + FE dev servers):

1. Mở `http://localhost:8080/` (đường A) hoặc `http://localhost:3000/` (đường B) → login `alice@demo.local` / `demo-password`.
2. Nav → **Tasks**: tạo task mới → hiện trong danh sách (node-svc thật; có assignee thì đi qua spring validate).
3. Nav → **Activity**: feed/stats phản ánh task vừa tạo (node push event → go-svc).
4. Kill 1 remote dev server → reload shell → error boundary, remote còn lại vẫn chạy.

> ⚠️ Known bug (SF-7 phát hiện, đã report epic FI-62 — chờ SF-3 fix): route users của spring-svc đang double-prefix (`/api/users/users/*`) → tạo task **kèm assignee** bị 422, userName trong feed rỗng. Task không assignee chạy bình thường.

## 5. Copy/scaffold project mới

```bash
bash scripts/scaffold/scaffold.sh my-project
cd my-project
pnpm install --no-frozen-lockfile   # lần đầu non-frozen — xem SCAFFOLD.md
# rồi lặp lại mục 2-4 trong project mới
```

## 6. CI báo gì

| Workflow | Chạy khi | Bằng chứng |
|----------|---------|-----------|
| `contracts` | contracts/**, platform/** đổi | spectral + gitleaks + compose config + boot-smoke auth-mock + schemathesis |
| `services-*` / `shell` / `remotes-*` | thư mục tương ứng đổi | build + test + docker build + boot-smoke |
| `convergence` (SF-7) | mọi push | e2e smoke compose + copy-dir standalone + scaffold output build được |
