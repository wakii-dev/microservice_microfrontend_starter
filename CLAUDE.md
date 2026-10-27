# CLAUDE.md — onboarding AI cho architecture-overview

Boilerplate nội bộ copy-able (epic FI-62): mixed-stack services (Node/Spring/Go) + Module Federation FE (Rspack), demo e2e task management qua nginx gateway. Bản đồ structured cho agent parse: [orca.yaml](orca.yaml). Cho người mới: [docs/walkthrough.md](docs/walkthrough.md).

> Agent mới đến (Claude/Codex/Cursor): đọc [AGENTS.md](AGENTS.md) trước — reading order + git/multi-session rules + verify nhanh.
> Knowledge base (gotchas chi tiết + where-is-what): [docs/ai/knowledge.md](docs/ai/knowledge.md).
> Recipes UI: [docs/ai/recipes.md](docs/ai/recipes.md); quick-reference ui-kit nằm ở Phần II của AGENTS.md.

## Nguyên tắc vàng (vi phạm = review fail)

1. **Contracts là source of truth** — sửa spec/DDL/event contract TRƯỚC, code theo sau (`contracts/`).
2. **Gateway :8080 là cổng duy nhất** browser/FE chạm vào; inter-service đi qua tên compose (`http://node-svc:3001`), không localhost.
3. **Conventions bắt buộc** — `platform/conventions/01–09`: Dockerfile, healthcheck, logging JSON, error envelope, ports, config, CORS, gateway/remotes, async messaging.
4. **Không sửa READ-LOCKED** ngoài story/epic được duyệt — xem bảng frontend bên dưới.

## Bản đồ repo

```
contracts/    openapi (tasks·users·activity·auth) + db/tasks-schema.sql (canonical DDL)
              + events/ (task-events.md + fixtures golden) + auth/users.json (id cố định)
platform/     docker-compose.yml (10 services) · gateway/nginx ·
              postgres/init · conventions/ (01–09)
services/     node-svc :3001 (Fastify+TS+Drizzle — CRUD, outbox, compensation)
              spring-svc :8081 (Boot 3 — users/teams) · go-svc :8082 (chi — activity, Kafka consumer, saga)
              auth-svc :8090 (Fastify+TS+Drizzle — register/login/refresh/RBAC, epic auth-real)
app/     shared (fe-shared — logic: api/token/error/MF) · ui-kit (38 components + Storybook + motion)
              shell :3000 (MF host) · remotes/tasks :4001 · remotes/activity :4002 · spike (MF pins)
scripts/      smoke/e2e.sh (2 chiều) · scaffold/scaffold.sh
docs/         walkthrough · adr/0001–0010 · toolchain · superpowers/ (spec+plan+evidence theo story)
```

## Lệnh hằng ngày

| Việc | Lệnh |
|---|---|
| Cài root (FE workspace) | `pnpm install --frozen-lockfile` |
| node-svc cài riêng | `cd services/node-svc && pnpm install --frozen-lockfile --ignore-workspace` |
| auth-svc cài riêng | `cd services/auth-svc && pnpm install --frozen-lockfile --ignore-workspace` |
| Dev FE | `pnpm --filter <pkg> dev` (shell :3000, remotes :4001/:4002) |
| Test shell (+typecheck) | `pnpm --filter shell test && pnpm --filter shell typecheck` |
| Test node-svc / auth-svc | `pnpm --filter node-svc test` · `pnpm --filter auth-svc test` |
| Test go / spring | `cd services/go-svc && go test ./...` · `cd services/spring-svc && ./mvnw test` |
| Codegen types node-svc | `pnpm --filter node-svc generate:types` (từ `contracts/openapi/tasks.yaml`) |
| Lint contracts | `pnpm lint:contracts` (spectral) |
| Chạy full stack + e2e | xem `run.compose` trong [orca.yaml](orca.yaml) — tạo topic TRƯỚC khi boot |

## Ports (nguồn sự thật: `platform/conventions/05-ports.md`)

gateway **8080** · shell 3000 · remote tasks 4001 · remote activity 4002 · node-svc 3001 · spring-svc 8081 · go-svc 8082 · auth-svc 8090 · postgres 5432. Sửa port = 4 chỗ cùng commit (conventions/05 + .env.example + compose + README).

## Workflow có contracts (sửa API)

spec OpenAPI → `pnpm lint:contracts` → codegen node-svc types → impl → sync snapshot go-svc (`internal/api/openapi/` phải bit-identical — CI drift-guard) → fixtures golden nếu event đổi. Chi tiết từng service trong README của service đó.

## READ-LOCKED (frontend)

- `app/shared/src/{api-client,token-storage,error-envelope,mf-bootstrap}.ts` + `package.json#mfToolkit` — cấm sửa ngoài epic được duyệt (versions đã test thật: MF host :3000 load remote :4001).
- Nâng cấp react/rspack/@module-federation/enhanced (catalog: trong `pnpm-workspace.yaml`) **phải re-spike** qua `app/spike` trước.
- fe-shared consumed QUA SOURCE, không build riêng; remote standalone tự mang tokens (import tokens trong entry).
- Design system (tokens/primitives) đã tách sang `app/ui-kit` (ADR-0009) — KHÔNG read-locked; đổi qua story thường + Storybook evidence.

## Run demo

Đường A (compose — khuyến nghị): lệnh đầy đủ trong `run.compose` của [orca.yaml](orca.yaml) → mở http://localhost:8080 → login `alice@demo.local` / `demo-password`. Saga demo: assign task cho `fail@demo.local` → badge "Gán thất bại" + event ở `task-events.dlq`. Verify: `bash scripts/smoke/e2e.sh` PASS 15 bước (happy + auth-real register/refresh/RBAC + saga + DLQ). Đường B native: `docs/walkthrough.md`.

## Docs map — làm gì thì đọc gì TRƯỚC

| Việc | Đọc |
|---|---|
| Onboard / chạy demo lần đầu | `docs/walkthrough.md` + `docs/toolchain.md` |
| Code bất kỳ service nào | `platform/conventions/01–09` (+ README service đó) |
| Sửa API/contract | `contracts/openapi/*.yaml` + `platform/conventions/04` (envelope) + skill `sync-contracts` |
| Đụng Kafka/outbox/saga/DLQ | `platform/conventions/09` + `docs/adr/0008` + `contracts/events/task-events.md` |
| Đụng FE/MF/design system | `docs/adr/0002` + `docs/adr/0009` + `app/ui-kit/README.md` + `app/shared/README.md` |
| Vì sao kiến trúc vậy | `docs/adr/0001–0010` |
| Tổ chức epic/story với Wakii | `docs/wakii-playbook.md` (4 archetype chia SF + gates) |
| Tạo service mới | skill `add-service` (`.claude/skills/`) — thủ tục 4 SF + lệnh verify |
| Mở PR / merge / branch | `docs/git-flow.md` — mọi thay đổi vào `main` qua PR (template `.github/pull_request_template.md`) |

## CI (`.github/workflows/` — chạy mỗi push theo thư mục đổi)

> ⚠️ **Trạng thái 2026-10: các workflow GitHub Actions hiện ĐANG DISABLE (billing).** Gate thực tế khi push là **`.husky/pre-push`** (cài sẵn qua `pnpm install` root): branch rule `wakii-dev/<loại>-<slug>` (mirror git-guard) + FE checks theo path package đổi — ui-kit (typecheck/test/build-storybook), shell (typecheck/test/build), remote-tasks/remote-activity (typecheck/test). Bảng dưới giữ làm mô tả các workflow để bật lại khi cần.

| Workflow | Nội dung |
|---|---|
| `contracts` | spectral + gitleaks + compose config + boot auth-svc + schemathesis FULL |
| `services-node-svc` / `services-go-svc` / `services-spring-svc` | build + test + docker build + boot-smoke (node/go có kafka) |
| `shell` / `remotes-tasks` / `remotes-activity` | install + typecheck + test + build |
| `ui-kit` | install + typecheck + test + coverage + **build-storybook** (ADR-0009 — không publish) |
| `git-guard` | mọi PR — enforce branch name (`wakii-dev/<loại>-<slug>`) + commit message theo [git-flow.md](docs/git-flow.md); feedback sớm hơn = `git config core.hooksPath .githooks` |
| `convergence` | mọi push — e2e 2 chiều trên compose 10 services (happy qua Kafka + saga → DLQ assert) + copy-dir standalone (fe-shared + ui-kit) + scaffold build được |

## Gotchas (đầy đủ trong `gotchas:` của orca.yaml)

- node-svc + auth-svc: standalone lockfile — `pnpm install` **--ignore-workspace**, trong thư mục service.
- Vitest ranh giới ngày: TZ pin trong `vitest.config.ts` (`test.env`) — đừng bỏ.
- pgdata volume cũ thiếu user saga-seed + role `auth_svc`/schema `auth` (auth-real SF-5) → `docker compose down -v` 1 lần rồi up lại; `.env` bản cũ thêm `AUTH_SVC_DB_PASSWORD`.
- `assignment_failed` system-owned: re-assign không tự reset — PATCH `{assigneeId, status:"todo"}`.
- `.env` không commit. Compose env luôn kèm `--env-file platform/.env`.

## AI boilerplate

- [orca.yaml](orca.yaml) — descriptor máy đọc (services/ports/commands/gotchas).
- `.claude/agents/` — 4 agent miền: `fe-dev` · `be-dev` · `e2e-runner` · `contracts-keeper`.
- Scaffold project mới: `bash scripts/scaffold/scaffold.sh <tên-mới>` (bộ AI files đi kèm).
- Culture evidence: đổi behavior đáng kể → chụp test-run/screenshot vào `docs/superpowers/evidence/` khi làm theo story workflow.

## Team protocol — ui-kit multi-agent (bắt buộc từ 2026-10-18)

Khi làm worker trong terminal Orca của repo này (điều phối bởi ZCode lead):

1. **Xong mission** → chạy verify theo brief → **BÁO CÁO tóm tắt + paste kết quả verify thật** → **DỪNG**, chờ lead giao việc kế. KHÔNG tự chuyển mission trừ khi brief ghi rõ chuỗi.
2. Lead ACK mỗi report trong ~10s; mọi report + gate được log lên board chung `docs/team/TEAM.md` (roster + standup ~30 phút + report log) — PO đọc board là thấy nhịp team.
3. **Quyền sở hữu file tách bạch**: chỉ đụng file trong scope brief; barrel `src/index.ts` thêm dòng alphabet, đọc trước khi sửa; check `git status` từng file trước khi đụng (tránh đụng WIP người khác).
4. **Path an toàn**: mọi đường dẫn ghi file dùng tuyệt đối từ `app/ui-kit/...` — KHÔNG dùng relative `src/...` từ repo root (đã gây file lạc chỗ).
5. **Gate độc lập**: lead tự chạy verify trên diff thật trước khi commit — report của worker là đầu vào, không phải chân lý.
6. Session chết giữa chừng: lead cứu WIP từ git (commit ghi rõ "recovered by coordinator") — luôn giữ tree ở trạng gian test-xanh-được.
- **Peer-to-peer**: cần gì ở teammate → `docs/team/inbox/<tên>.md` (format `[HH:MM] @<bạn> → nội dung`); lead giao thư mỗi chu kỳ; broadcast → `docs/team/CHANNEL.md`.
