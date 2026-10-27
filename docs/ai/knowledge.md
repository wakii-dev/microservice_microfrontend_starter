# Knowledge base — gotchas + where-is-what (cho AI agents)

Directives if-then. Mỗi gotcha = sự cố đã xảy ra thật trên repo này. IF vấp triệu chứng THEN làm đúng directive — KHÔNG điều tra lại từ đầu. Bản tóm tắt 1 dòng mỗi bẫy: [AGENTS.md §6](../../AGENTS.md).

## Recipes (viết UI)

- IF viết UI THEN [recipes.md](recipes.md) (20 recipes copy-chạy được) + Phần II [AGENTS.md](../../AGENTS.md) (quy tắc bắt buộc + anti-patterns).
- IF cần đối chiếu visual THEN `pnpm --filter ui-kit storybook` → http://localhost:6006.
- IF customize component THEN mọi component nhận `classNames` slots + `style` (ghi chú "Customize (từ 0.7)" — Phần II AGENTS.md).

## Gotchas

### registry-propagation
- IF `npx`/`pnpm add` thấy version cũ hoặc 404 ngay sau publish THEN registry + CDN cần 2–5 phút propagate → verify `npm view <pkg> versions` + dist-tags, đợi. KHÔNG publish lại vì tưởng hỏng.
- IF publish xong phát hiện thiếu file THEN KHÔNG publish đè cùng version (version đã chiếm là vĩnh viễn) → fix + bump version mới.

### kafka-topic-before-consumer
- IF consumer group `Stable` nhưng 0 fetch/0 commit, assignment/feed rỗng vĩnh viễn (KHÔNG crash) THEN consumer join trước khi topic auto-create → `docker compose down -v`; tạo topic `task-events` + `task-events.dlq` TRƯỚC khi boot (`kafka-init` compose one-shot + `EnsureTopics` go-svc).
- IF DLQ publish fail "Unknown Topic" THEN cùng nguyên nhân — topic `.dlq` cũng phải tồn tại trước.

### pipe-swallows-exit-code
- IF verify qua `cmd | tail` / `| head` THEN `$?` là của lệnh CUỐI — PASS ảo → kết luận PASS chỉ từ exit code thật (chạy không pipe; `${pipestatus[1]}` zsh / `${PIPESTATUS[0]}` bash) hoặc `pnpm verify:quick --json`.

### tarball-publish
- IF publish script copy tay (`cp` theo basename) THEN tarball mất file (CSS tokens, docs/assets, bit +x) — chỉ lộ ở consumer, không lộ trong repo → TRƯỚC mọi publish: `npm pack` + `tar -tzf` soi đủ file; publish script phải có guard file sống còn.

### port-conflict
- IF `EADDRINUSE` hoặc browser thấy bản UI cũ lạ ở một port THEN dev server cũ còn treo (session trước chết không cleanup) → `lsof -iTCP:<port> -sTCP:LISTEN` + kill PID.
- IF xong mission THEN tắt sạch server mình đã mở.

### docker-parallel-build
- IF 2 docker build chạy song song trên cùng engine THEN quá tải → treo/sập giữa build → build tuần tự; IF engine đã sập THEN restart Docker Desktop sạch + `docker builder prune` + build lại.

### branch-slug
- IF push bị chặn `branch … vi phạm rule wakii-dev/…` THEN slug sai regex `^wakii-dev/(story|sf|fix|docs|chore|feat)-[a-z0-9][a-z0-9-]*$` (có `.`/`_`/chữ hoa) → `git branch -m <tên-đúng>` NGAY lúc tạo nhánh — đừng đợi push mới phát hiện.

### manager-head-badge
- IF `app/ui-kit/.storybook/manager-head.html` dirty mà không ai sửa THEN `scripts/stamp-build.cjs` tự ghi build badge (version + sha + giờ) mỗi lần `storybook dev`/`build` → KHÔNG commit file này; lỡ vào commit thì revert phần badge về giá trị cũ.

### vitest-tz
- IF test ranh giới ngày/month đỏ local mà xanh CI (hoặc ngược lại) THEN TZ máy lệch làm mép ngày trôi → TZ pin trong `vitest.config.ts` (`test.env`) là bắt buộc, KHÔNG bỏ; test thời gian inject `now`, không đọc clock thật.

### standalone-lockfile
- IF cài node-svc/auth-svc bằng lệnh từ workspace root THEN thiếu deps / lockfile service bị ghi đè → `cd services/<svc> && pnpm install --frozen-lockfile --ignore-workspace` (chạy TRONG thư mục service).

### pgdata-volume
- IF boot thiếu user saga-seed / role `auth_svc` / schema `auth` THEN volume cũ không có seed mới (init script chỉ chạy trên volume mới) → `docker compose --env-file platform/.env down -v` 1 lần rồi up lại; `.env` bản cũ bổ sung `AUTH_SVC_DB_PASSWORD` từ `.env.example`.
- IF worktree khác đang chạy stack THEN `down -v` giết stack của nó luôn (compose project dùng chung) → `docker ps` TRƯỚC khi down.

### assignment-failed-reset
- IF re-assign task mà badge "Gán thất bại" không biến mất THEN status là system-owned, re-assign không tự reset → PATCH tường minh `{assigneeId, status: "todo"}` (writable: `todo/in_progress/done`).

### network-and-env
- IF inter-service gọi `localhost` THEN chạy được native nhưng chết trong compose → luôn dùng tên compose `http://node-svc:3001`; browser/FE chỉ chạm gateway :8080.
- IF `.env` xuất hiện trong `git status` THEN KHÔNG commit — mẫu cấu hình: `platform/.env.example`.

### port-4-places
- IF đổi port THEN cùng MỘT commit sửa đủ 4 chỗ: `platform/conventions/05-ports.md` + `.env.example` + `docker-compose.yml` + README. Thiếu 1 chỗ = review fail.

### react-query-mf-singleton
- IF remote (in-shell) tự tạo QueryClient THEN cache tách khỏi host — tạo task mà activity feed không thấy → QueryClient DUY NHẤT ở host (`app/shell/src/App.tsx`, module-level); remotes dùng chung qua MF; rspack share `@tanstack/react-query` ĐỐI XỨNG shell↔remote (`app/remotes/tasks/rspack.config.mjs`).

## Where-is-what — việc X → file Y

| Khi cần… | Đọc / sửa |
|---|---|
| Sửa API/contract (endpoint, field, schema, event) | `contracts/openapi/*.yaml` · `contracts/db/tasks-schema.sql` · `contracts/events/task-events.md` (+ fixtures golden) — skill `sync-contracts`; codegen `pnpm --filter node-svc generate:types`; go snapshot `internal/api/openapi/` bit-identical (drift-guard) |
| Sinh code mới (service / app / feature) | `pnpm gen:service` · `gen:app` · `gen:feature` (`--json` → `{created, modified, next_steps}`) — code tại `scripts/generators/`; agent `service-dev` (BE) / `ui-dev` (FE) |
| Thêm service mới (thủ tục đầy đủ) | skill `add-service` (`.claude/skills/`) — 4 SF + gates; conventions 01–09 |
| Verify / gate trước merge | `pnpm verify:quick` (`--json` → `[{step,status,duration}]` + exit code) — agent `gate-keeper`; checklist PR: docs/WORKFLOW.md §2 |
| Đụng Kafka / outbox / saga / DLQ | skill `wakii-debug-kafka` + `platform/conventions/09` + `docs/adr/0008` + `contracts/events/task-events.md`; agent `e2e-runner` khi cần chạy stack |
| Publish package npm | skill `wakii-publish` + agent `release-manager` + docs/WORKFLOW.md §4 + `app/ui-kit/RELEASE.md` |
| Feature → PR (vòng đời có gate) | skill `wakii-ship-feature` + docs/WORKFLOW.md §2 |
| FE / Module Federation / design system | `docs/adr/0002` + `docs/adr/0009` + `app/ui-kit/README.md` + `app/shared/README.md`; recipes ở [recipes.md](recipes.md); **read-locked** `app/shared/src/{api-client,token-storage,error-envelope,mf-bootstrap}.ts` — cấm sửa ngoài epic; nâng cấp react/rspack/MF → re-spike qua `app/spike` |
| Tokens / theme / màu | `app/ui-kit` (tokens + `UiKitProvider` + `themes/dark.css`) — rules tokens-only ở Phần II AGENTS.md |
| Team workflow / multi-session / epic-story | docs/WORKFLOW.md §1 + §6 · `docs/wakii-playbook.md` (4 archetype chia SF) · board `docs/team/TEAM.md` |
| Chạy demo / e2e / debug stack | `run.compose` trong `orca.yaml` · `scripts/smoke/e2e.sh` · `docs/walkthrough.md` |
| Scaffold project mới từ boilerplate | `bash scripts/scaffold/scaffold.sh <tên>` · package `create-wakii-stack` (npx) |
| Mở PR / merge / branch / commit | `docs/git-flow.md` + template `.github/pull_request_template.md` |
| Ports / config / healthcheck / logging / CORS / Dockerfile | `platform/conventions/01–09` (05 = ports) |
| Vì sao kiến trúc vậy | `docs/adr/0001–0010` |
| Agents + skills AI | `.claude/agents/` (fe-dev · be-dev · e2e-runner · contracts-keeper · service-dev · ui-dev · gate-keeper · release-manager) · `.claude/skills/` (add-service · sync-contracts · wakii-ship-feature · wakii-publish · wakii-debug-kafka) |
| Onboard người mới / chạy lần đầu | `docs/walkthrough.md` + `docs/toolchain.md` |
