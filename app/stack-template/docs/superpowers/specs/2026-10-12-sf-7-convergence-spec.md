# SF-7 Spec — Convergence & Scaffold (FI-75)

> Story FI-62 · SF-7/7 (tier 3, phase 3/3) · 2026-10-12
> Source: epic spec rev 3 (`2026-10-12-boilerplate-microservice-mfe.md`) + context pack `docs/superpowers/contexts/sf-7.md`
> Status: Approved — autonomous mode (epic-level đã qua spec-critic rev 3 + plan-critic; SF slice hội tụ, KHÔNG thêm quyết định mới ngoài epic). Brainstorm self-answered theo Phase 2 mandate.

## 0. Root cause analysis

**5 Whys**: Vì sao cần SF-7? → Vì SF-1..6 xây song song, mỗi SF chứng minh phần MÌNH. → Không artifact nào chứng minh CHUỖI 3 service chạy liền mạch như code committed. → Docs viết ở thời SF-1 đã lệch thực tế (README còn nói "khung rỗng"). → Người copy boilerplate không có đường đi từ fresh-clone đến demo chạy được. → Vấn đề thật: **hội tụ + chứng minh + bàn giao**, không phải viết thêm tính năng.

Hiện trạng (dest @ec7c3d3): 6 services impl xong + CI per-stack xanh + browser e2e SF-6 verify native; thiếu: smoke script committed, copy-dir proof trong CI, health-gated compose chain, ADR/toolchain/walkthrough, scaffold, security-audit cuối.

Chiến lược: **hội tụ tại chỗ** (không re-architect); mọi bug business logic thấy được ở `services/`/`frontend/` = report coordinator, KHÔNG fix (SF sở hữu fix).

## 1. Problem

Người mua boilerplate (dev team nội bộ) phải: (a) tin chuỗi e2e chạy được — chưa có proof committed; (b) copy 1 repo-con ra dùng riêng — chưa được chứng minh trong CI; (c) sinh project mới từ boilerplate — chưa có script; (d) đọc docs để tự chạy từ fresh-clone — docs đang stale; (e) nhận được code sạch bảo mật — chưa có audit cuối.

## 2. Scope

**In:**
1. `scripts/smoke/e2e.sh` — curl API-level qua gateway: login auth-mock → POST task (node-svc, assignee validate qua spring) → GET feed (go-svc); assert task title xuất hiện trong feed + stats đúng.
2. CI convergence workflow (file RIÊNG, không đụng template SF-1): job e2e-smoke (docker compose up + chạy e2e.sh), job copy-dir-smoke (copy ≥1 service + `frontend/shared` ra tmp → build/test pass), job scaffold-verify (chạy scaffold → output `pnpm install` + build được).
3. `platform/docker-compose.yml`: healthcheck wget busybox `/readyz` cho **node-svc + spring-svc** (đã probe: node:22-alpine + eclipse-temurin:21-jre-alpine đều có busybox wget) + health-gated `depends_on` — CHỈ phần này được sửa trong compose. **go-svc NGOẠI LỆ có chủ đích** (P0 spec-critic): runtime distroless không shell/wget, Dockerfile READ-ONLY → healthcheck in-container bất khả; gateway gate `service_started` cho go-svc; readiness go-svc chứng minh bằng e2e.sh poll `/api/activity/stats` trước feed assert (retry). **Gateway KHÔNG thêm healthcheck** (P1 spec-critic vòng 2: nginx proxy thuần không route /readyz — probe sẽ 404 deadlock; wait đã do e2e.sh poll `/api/auth/readyz` đảm nhiệm). Exception ghi vào conventions/02 rule 3.
4. Docs: ADR 7 quyết định (mixed stack, MF/Rspack, contract-first, readonly schema trade-off, fail-closed vs degrade, fire-and-forget events, fork-not-upgrade), toolchain doc (JDK/Go/Node/pnpm/docker cần ở đâu), fresh-clone walkthrough checklist, README sync (Mermaid + hướng dẫn chạy = kiến trúc thật).
5. Scaffold script `scripts/scaffold/` — copy + rename + prune thuần (bash), sinh project đặt tên mới, cùng flow chạy được. Trễ = scope-flag lên user, KHÔNG auto-complete manual fallback.
6. Xử lý 2 findings SF-1-owned — **nguồn uỷ quyền: story brief FI-62 (.story-brief.md dòng 3) chỉ đích danh SF-7 xử lý** (commit ec7c3d3 là recovery của chính brief): conventions/02 mirror rule healthcheck paths (improvements-log SF-4 finding #4); canonical DDL note tách CREATE SCHEMA khỏi tables (improvements-log SF-4 finding #5). Rà thêm các [p6-flag] conventions sync cùng nguồn uỷ quyền (dòng "rà các [p6-flag] conventions sync"): conventions/01 standalone-lockfile variant (SF-2 flag), conventions/08 requiredVersion:false singleton (SF-6 flag). Sửa compose thì cập nhật banner ownership (SF-7 convergence).
7. Security-audit checkpoint (secrets/exec-bit/lockfile/deps OWASP surface) — 0 P0/P1 mở.
8. Rà multi-stage + pinned base images toàn bộ Dockerfile (report, không sửa trừ khi P0).
9. Rule 0: smoke chạy THẬT native local + evidence; browser walkthrough = human gate — ghi hướng dẫn sẵn cho user.

**Out:** browser trong CI; fix business logic services/FE; merge main/PR; tính năng mới; k8s; Keycloak thật.

## 3. Touch map

| File | Hành động |
|---|---|
| `scripts/smoke/e2e.sh` | tạo [SỞ HỮU] |
| `scripts/scaffold/**` | tạo [SỞ HỮU] |
| `.github/workflows/convergence.yml` | tạo [SỞ HỮU — file convergence riêng] |
| `docs/adr/**`, `docs/toolchain.md`, `docs/walkthrough.md` | tạo [SỞ HỮU] |
| `README.md` | sửa (sync cuối) |
| `platform/docker-compose.yml` | sửa — CHỈ healthcheck + depends_on chain |
| `platform/conventions/02-healthcheck.md`, `01-dockerfile-pattern.md`, `08-gateway-and-remotes.md` | sửa — sync findings [p6-flag] |
| `contracts/db/tasks-schema.sql` | sửa — note CREATE SCHEMA (comment-only, không đổi DDL) |
| `services/*`, `frontend/*` | READ-ONLY |
| `.github/workflow-templates/` | READ-ONLY (thiếu gì = flag) |

## 4. Design

### 4.1 e2e smoke script (API-level)
- Bash thuần + curl + jq-light (grep/python-free fallback? — dùng grep + sed, tránh jq dependency; CI ubuntu có jq nhưng script phải chạy được local Git Bash). Quyết: dùng `node -e` KHÔNG — giữ curl+grep thuần; JSON assert bằng grep pattern ổn định theo contract (accessToken, title echo, feed items chứa title).
- Env: `GATEWAY_URL` (mặc định `http://localhost:8080`), `SMOKE_EMAIL`/`SMOKE_PASSWORD` (mặc định alice@demo.local/demo-password), `SMOKE_TITLE` prefix unique theo `date +%s` để re-run được.
- Chain assert: login 200 + accessToken → POST /api/tasks 201 (assigneeId = bob UUID để đi qua spring validate) → GET /api/activity/feed có item action `task.created` chứa title — **poll 10×1s** (P1 spec-critic: node push fire-and-forget KHÔNG await, go-svc persist async → assert ngay = flaky CI) → GET /api/activity/stats: fetch **baseline totalTasks TRƯỚC khi tạo task**, assert sau ≥ baseline+1. Exit non-zero + message rõ khi fail ở bước nào. Wait-before-assert: poll `/api/auth/readyz` QUA gateway :8080 (gateway không có /readyz riêng — P2 critic).
- Cùng 1 script dùng cả native lẫn qua gateway: chỉ cần GATEWAY_URL trỏ đúng.

### 4.2 Health-gated compose
- Healthcheck `/readyz` (wget busybox) **CHỈ node-svc + spring-svc** — đã probe Dockerfile: cả hai runtime alpine có busybox wget.
- **go-svc: `service_started`** (distroless, Dockerfile READ-ONLY — P0 spec-critic); readiness chứng minh ở e2e.sh poll stats.
- **Gateway: KHÔNG healthcheck** (nginx không route /readyz — probe 404 deadlock, P1 critic vòng 2); wait do e2e.sh đảm nhiệm.
- Chain: postgres (healthy) → auth-mock (healthy, existing) → node/spring (healthy, mới); node-svc depends_on spring-svc healthy (readyz node kiểm spring reachable); gateway depends_on auth-mock + node + spring `service_healthy`, go-svc `service_started`.
- Validate: `docker compose --env-file platform/.env.example config -q` (KHÔNG cần Docker daemon) + CI chạy thật.

### 4.3 CI convergence.yml
- Trigger: `branches: ["**"]` + workflow_dispatch (workflow hội tụ — chạy full, không path-filter; P2 critic: tránh CI âm thầm không chạy khi branch rename).
- Job `e2e-smoke`: checkout → `docker compose --env-file platform/.env.example up -d --build` (reuse .env.example — P2 critic, thay "sinh .env 10 biến") → poll `/api/auth/readyz` qua :8080 → `bash scripts/smoke/e2e.sh` → dump logs khi fail (compose gọi lại CÙNG `--env-file` — p6-flag SF-2).
- Job `copy-dir-smoke`: copy `services/node-svc` + `frontend/shared` → `$RUNNER_TEMP/standalone` → node-svc: `pnpm install --ignore-workspace && pnpm test && pnpm build` (theo README standalone); fe-shared: typecheck `tsc --noEmit` (fe-shared không có scripts riêng; GHI RÕ trong job: fe-shared inert cho node-svc — proof FE copy-dir mạnh hơn = remote-tasks kèm shared, để làm follow-up nếu CI budget cho phép; Acceptance #6 context pack là "≥1 service + fe-shared").
- Job `scaffold-verify`: chạy `scripts/scaffold/scaffold.sh --name demo-app --out $RUNNER_TEMP/demo-app` → `pnpm install --no-frozen-lockfile` + build FE shell + `docker compose config -q` trong output → pass. **Narrowing tường minh (cite context pack sf-7.md ACCEPTANCE: "CI verify scaffold output build được")**: CI chỉ chứng minh build + compose-config trên output; full e2e trên scaffold output = **human gate** cần Docker — hướng dẫn nằm trong SCAFFOLD.md + walkthrough.
- Không browser, không secret ngoài placeholder CI.

### 4.4 Scaffold
- `scripts/scaffold/scaffold.sh <new-name> [--out dir]`: **cp/tar-based (KHÔNG rsync — không có mặc định trong Git Bash Windows, P2 critic)** trừ `.git`, `.github/workflow-templates`, `docs/superpowers`, `node_modules`, `frontend/spike`, `.story-brief.md`; **prune `.github/workflows/convergence.yml`** (pin story branch — chết trong repo mới; giữ per-service workflows + contracts.yml vì generic + path-filtered); rename: package names `@boilerplate/*` → `@<new-name>/*` (kể cả root `package.json` name — P2 critic), compose `name:`, README title; xử lý root `pnpm-lock.yaml` importers (strip spike + rename scope — probe tại task); giữ contracts + platform + services + frontend/shell + remotes + shared + scripts/smoke; ghi `SCAFFOLD.md` nguồn gốc + ngày + hướng dẫn full-e2e human gate. Không generator framework.
- Windows dev: bash script chạy Git Bash (docs ghi rõ); CI chạy ubuntu. exec-bit không set từ Windows — CI/README gọi `bash scripts/...` (ghi vào audit).

### 4.5 Docs
- `docs/adr/README.md` index + 7 ADR ngắn (1 file/quyết định, format: Context/Decision/Consequences).
- `docs/toolchain.md`: bảng tool × ai cần (dev native / CI / copy-user).
- `docs/walkthrough.md`: fresh-clone checklist số bước, cả compose lẫn native, khớp đúng lệnh đã verify trong evidence.
- README: cập nhật kiến trúc (6 services đủ), mục Chạy (compose + native + smoke), repo map mới, xoá state SF-1 stale.

### 4.6 Findings + conventions sync
- conventions/02: thêm mirror rule — service expose `/healthz`+`/readyz` naked VÀ mirror dưới prefix `/api/<svc>/*` (auth-mock precedent) để OpenAPI servers.url + schemathesis khớp.
- tasks-schema.sql: comment note — phần CREATE SCHEMA tách Apply context (db-level CREATE privilege) khỏi table DDL (schema-level); CI apply-as-role chạy 2 phần bằng user khác nhau.
- conventions/01: variant standalone lockfile (COPY local lockfile khi build context = thư mục con).
- conventions/08: singleton remote khai `requiredVersion: false` tường minh (`catalog:` literal rò vào requiredVersion).
- 04-error-envelope: note additionalProperties decision? — chỉ ghi khi quyết chung đã có ở node-svc; KHÔNG tự chốt thay 3 service (flag nếu chưa chốt).

### 4.7 Security checkpoint
- security-audit agent trên toàn diff + repo scan: secrets (gitleaks đã có CI — review kết quả), exec-bit scripts, .env không commit, lockfile sync, deps surface (OWASP theo tính năng: JWT HS256 shared secret, CORS dev-profile, gateway 401).
- 0 P0/P1 mở mới được DONE.

## 5. Implementation outline

10 tasks (DAG):
1. `docs-sync` — conventions sync + DDL note (T1) — không phụ thuộc
2. `compose-health` — health-gated compose (T2) — phụ thuộc đọc Dockerfile 3 svc (probe trong task)
3. `smoke-script` — e2e.sh (T3) — không phụ thuộc
4. `ci-smoke` — convergence.yml job e2e-smoke (T4) — phụ thuộc T2+T3
5. `ci-copydir` — job copy-dir-smoke (T5) — phụ thuộc đọc README node-svc
6. `scaffold` — scaffold.sh (T6) — không phụ thuộc
7. `ci-scaffold` — job scaffold-verify (T7) — phụ thuộc T6
8. `adr-toolchain` — ADR 7 + toolchain.md (T8) — không phụ thuộc
9. `readme-walkthrough` — README sync + walkthrough.md (T9) — phụ thuộc T8 (link ADR) + T3 (lệnh smoke)
10. `verify-evidence` — Rule 0 native smoke + evidence + security-audit + independent review (T10) — phụ thuộc T1-T9

Test strategy: smoke script chạy thật native (evidence); `docker compose config` validate compose; CI xanh sau push là gate thật cho 3 job mới; docs không có test — walkthrough phải khớp lệnh đã chạy.

## 6. Risks

- Dockerfile image base có/không curl/wget cho healthcheck → probe từng Dockerfile trước khi viết compose (không đoán).
- Feed action string thật ("task.created"?) → đọc node-svc source event push (READ-ONLY) trước khi viết assert.
- CI compose job dùng `.env` — compose `${VAR:?}` fail hard nếu thiếu → job phải sinh .env đủ 10 biến.
- pnpm-lock trong scaffold output — copy nguyên lockfile + `pnpm install` lại (importers giữ nguyên tên workspace? rename `@boilerplate/*` phá lockfile importers → scaffold phải update importers trong lockfile hoặc chạy `pnpm install --no-frozen-lockfile` trong job verify; quyết tại T6, probe trước).
- Native toolchain `~/Tools/sf6-e2e` phải còn sống (đã verify ✓) — start scripts tái dùng.
