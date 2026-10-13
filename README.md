# Boilerplate Microservice + Micro-frontend

Template nội bộ **copy-able**: mixed-stack services (Node/Spring/Go) + Module Federation FE, demo e2e task management qua nginx gateway, Docker Compose + CI. Epic FI-62 — spec: `docs/superpowers/specs/2026-10-12-boilerplate-microservice-mfe.md` (rev 3).

**Người mới bắt đầu:** đọc [docs/walkthrough.md](docs/walkthrough.md) (fresh-clone → demo) + [docs/adr/](docs/adr/) (7 quyết định kiến trúc) + [docs/toolchain.md](docs/toolchain.md) (tool cần ở đâu). Copy thành project mới: `bash scripts/scaffold/scaffold.sh <tên-mới>`.

## Kiến trúc (đã dựng xong — 6 services + 3 FE + gateway + auth-mock)

```mermaid
graph TB
    subgraph repo ["repo này (multi-repo convention — mỗi thư mục = repo-con)"]
        subgraph contracts ["contracts/ — source of truth"]
            openapi["openapi/ tasks·users·activity·auth.yaml"]
            ddl["db/tasks-schema.sql — canonical DDL"]
            authc["auth/ users.json + token-contract.md"]
        end
        subgraph platform ["platform/"]
            compose["docker-compose.yml (9 services, health-gated chain)"]
            pginit["postgres/init/ (schemas + roles + default privileges)"]
            nginx["gateway/nginx (routing + JWT presence 401)"]
            authmock["auth-mock :8090 (JWT HS256, NOT-FOR-PROD)"]
            conv["conventions/ (8 docs)"]
        end
        subgraph services ["services/"]
            node["node-svc :3001 (Fastify+TS) — task CRUD"]
            spring["spring-svc :8081 (Spring Boot 3) — users/teams"]
            go["go-svc :8082 (Go 1.24+chi) — activity feed/stats"]
        end
        subgraph frontend ["frontend/"]
            shared["shared (fe-shared — api client, token, MF helper)"]
            shell["shell :3000 — MF host (Rspack)"]
            remotes["remotes/ tasks :4001 + activity :4002"]
            spike["spike (MF pin versions — đã test, prune khi scaffold)"]
        end
        scripts["scripts/ smoke/e2e.sh + scaffold/"]
    end

    browser["Browser"] --> gw["nginx gateway :8080<br/>CỔNG DUY NHẤT"]
    gw -- "/" --> shell
    gw -- "/remotes/*" --> remotes
    gw -- "/api/tasks/* + JWT" --> node
    gw -- "/api/users/* + JWT" --> spring
    gw -- "/api/activity/* + JWT" --> go
    gw -- "/api/auth/* (mở)" --> authmock
    node -- "validate user (2s, fail-closed 503)" --> spring
    node -- "event push fire-and-forget" --> go
    node -- "SQL (schema tasks)" --> db[("postgres :5432")]
    spring -- "SQL (schema users)" --> db
    go -- "readonly schema tasks + own activity" --> db
    authmock -- "đọc fixture" --> authc
    node -.-> openapi
    spring -.-> openapi
    go -.-> openapi
    node -.-> ddl
    go -.-> ddl
```

Chuỗi e2e chứng minh bởi: `scripts/smoke/e2e.sh` (local + CI job `convergence/e2e-smoke`) + browser walkthrough (human gate — [walkthrough.md](docs/walkthrough.md) mục 4).

## Port table

| Thành phần | Port | | Thành phần | Port |
|---|---|---|---|---|
| **nginx gateway** | **8080** | | node-svc | 3001 |
| shell (MF host) | 3000 | | spring-svc | 8081 |
| remote tasks | 4001 | | go-svc | 8082 |
| remote activity | 4002 | | auth-mock | 8090 |
| postgres | 5432 | | | |

Nguồn sự thật: `platform/conventions/05-ports.md`. Đổi port = sửa 4 chỗ cùng commit (conventions + .env.example + compose + README).

## Chạy

### Compose (máy có Docker — CI chạy mode này)

```bash
cd platform
cp .env.example .env        # điền JWT_SECRET (openssl rand -base64 48) + passwords
docker compose up -d --build   # health-gated chain: pg → auth-mock/spring → node → gateway (go-svc started)
bash ../scripts/smoke/e2e.sh   # PASS = login → tạo task → đọc feed liền mạch qua :8080
# shell + remotes: http://localhost:8080/ → login alice@demo.local / demo-password
# swagger: http://localhost:8080/api/auth/docs (auth-mock; các svc /api/<svc>/docs cần Bearer)
```

### Native (không Docker — từng service một)

Xem [docs/walkthrough.md](docs/walkthrough.md) mục 3-đường B (đủ lệnh cho 4 service BE + 3 FE dev servers). Native không có nginx gateway — FE gọi thẳng service port (CORS dev-profile, conventions/07).

### Scaffold project mới

```bash
bash scripts/scaffold/scaffold.sh my-project
cd my-project && pnpm install --no-frozen-lockfile   # lần đầu non-frozen — xem SCAFFOLD.md
```

Copy + rename + prune thuần (không generator) — chi tiết [ADR 0007](docs/adr/0007-fork-not-upgrade.md).

## Repo map

```
contracts/          # source of truth API/DB/auth — spectral lint trong CI
  openapi/          # 4 specs (tasks/users/activity/auth)
  db/               # canonical DDL bảng tasks (node migrate khớp, go query theo)
  auth/             # users fixture + token contract
platform/           # compose (health-gated), postgres init, nginx, auth-mock, conventions/
services/           # node-svc / spring-svc / go-svc — impl hoàn chỉnh, README standalone từng svc
frontend/
  shared/           # fe-shared — api client, token storage, MF bootstrap helper
  shell/            # MF host (Rspack) — login, nav, remote slots
  remotes/          # tasks + activity — 2 MF remote
  spike/            # MF pin versions — đã test (prune khi scaffold)
scripts/
  smoke/e2e.sh      # e2e smoke API-level: login → task → feed qua gateway
  scaffold/         # sinh project mới từ boilerplate
.github/
  workflows/        # contracts + per-service + convergence (e2e smoke, copy-dir, scaffold)
  workflow-templates/ # services-ci.yml.example — template cho service mới (prune khi scaffold)
docs/
  adr/              # 7 quyết định kiến trúc
  walkthrough.md    # fresh-clone → demo checklist
  toolchain.md      # tool cần ở đâu (dev/CI/copy-user)
docs/superpowers/   # spec, plans, evidence per SF (prune khi scaffold)
```

## Quy tắc quan trọng (ai copy boilerplate cũng phải biết)

1. API đổi = sửa `contracts/openapi/*.yaml` TRƯỚC (contract-first — [ADR 0003](docs/adr/0003-contract-first.md)), spectral phải pass.
2. JWT: gateway chỉ presence-check; **service tự verify** signature + expiry (`contracts/auth/token-contract.md` §4).
3. auth-mock **NOT FOR PRODUCTION** — copy dự án thật cắm OIDC tại boundary này.
4. Compose health-gated: node/spring probe `/readyz`; go-svc `service_started` (distroless) — readiness chứng minh bằng smoke script (conventions/02 rule 3).
5. fe-shared là dependency chung của shell/remotes — copy FE phải kèm `frontend/shared`.
6. Đổi quyết định kiến trúc = đọc ADR tương ứng trước (mỗi ADR ghi Consequences + điểm cắm thay thế).
