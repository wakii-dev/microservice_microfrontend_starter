# Plan: SF-6 FE remotes — tasks + activity (FI-74)
Date: 2026-10-12 | Linear: FI-74 | Worktree: wakii-dev/sf-6-fe-remotes | Story: FI-62
Spec slice: docs/superpowers/specs/2026-10-12-boilerplate-microservice-mfe.md rev 3 §SF-6 | Context pack: docs/superpowers/contexts/sf-6.md

## 0. Root cause analysis (WHY)

### Root cause
Shell (SF-5) đã merge với 2 remote slots trống (`RemoteSlot` load registry `tasks`/`activity`). BE thật đã có (node-svc/spring-svc/go-svc Done). Epic acceptance #1/#2/#3 (remote render → tạo task qua node-svc → feed phản ánh qua go-svc) chết ở chỗ: KHÔNG có remote app nào để fill slot.

### Current state (before feature)
- Shell :3000 expose `/tasks` `/activity` qua `RemoteSlot name={tasks|activity} exposedModule={./TasksPage|./ActivityPage}` + error boundary remote-down (evidence sf-5: `04-tasks-remote-down.png`).
- fe-shared (READ-ONLY): `ApiClient` (JWT + envelope decode), `tokenStorage`, `resolveRemoteUrl`, `loadRemoteModule`, `REMOTE_NAMES`.
- Compose PRE-SEED: entry `shell` có (SF-5 gap-answer), **remote-tasks/remote-activity CHƯA có** — BRIEF ủy quyền SF-6 tự thêm đúng 2 entry.
- Conventions: port table (4001/4002), registry (expose `./TasksPage`/`./ActivityPage`), CORS dev, error envelope, Dockerfile pattern.
- Catalog: react 19.3.0 / react-dom 19.3.0 / react-router ^7.9.0 / mf-enhanced 0.21.6 / rspack 1.7.12.

### Expected outcome
2 remote chạy dev native :4001/:4002, load vào shell qua slot; `/tasks` CRUD qua `/api/tasks` (node-svc thật, JWT, validate user qua spring thật); `/activity` feed + stats qua `/api/activity` (go-svc thật); vitest pass cả 2; CI xanh (build + test + boot-smoke: up + 200 + fetch được remoteEntry.js); compose có 2 entry remote.

### Constraints & hardships
- READ-ONLY: shell/fe-shared/catalog/compose (trừ 2 entry remote)/contracts/conventions — đụng khác = FLAG.
- KHÔNG Docker trên dev machine — verify docker qua CI; local demo native.
- KHÔNG thêm remote thứ 3.
- Pin matrix bắt buộc (nâng cấp = re-spike): react 19.3.0, rspack 1.7.12, mf-enhanced 0.21.6.
- Rule 0 BROWSER VERIFY: tự thấy login → tạo task (node-svc thật) → feed phản ánh (go-svc thật) — screenshot làm bằng chứng, KHÔNG tự kết luận từ DOM query.
- Linear rate-limited (39 ops queue) — sync qua linear-rate-limit runner, flush khi hết limit.

### High-level strategy
Clone pattern đã-test (spike remote + shell config) × 2 remote apps; UI tối giản (list + form + inline error, cùng class shell dùng); API layer mỏng bọc fe-shared ApiClient; singleton qua catalog:; tests vitest + testing-library mirror shell suite; Dockerfile/nginx/CI mirror shell.

## 1. Problem
Dev team copy boilerplate cần chứng minh micro-frontend + microservice chạy xuyên được: remote render trong host và gọi service thật qua gateway — không có remote thì epic chỉ là host trống.

## 2. Scope
- **In scope:** scaffold `frontend/remotes/tasks/` + `frontend/remotes/activity/` (Rspack + MF REMOTE + React 19 + TS, catalog: refs); tasks remote: list + tạo/sửa qua `/api/tasks` + JWT + error envelope → inline error; activity remote: feed + stats qua `/api/activity`, render userName/taskTitle từ response; shared singletons đúng MF 2.0; vitest per remote (component + api mocked); Dockerfile nginx static + nginx.conf + README standalone ×2; boot-smoke CI per remote; compose điền 2 entry pre-seed (gap-answer); BROWSER VERIFY Rule 0 e2e thật + evidence.
- **Out of scope:** service-side (SF-2/3/4 Done); sửa shell/fe-shared/catalog/contracts/conventions; remote thứ 3; docker local; i18n; OIDC thật.
- **Success criteria:** từng dòng ACCEPTANCE trong `docs/superpowers/contexts/sf-6.md` verify được + browser flow e2e thật có screenshot + TESTER REVIEW ĐỘC LẬP materialize `/tmp/story/fi62/code-reviewer-sf-6-fe-remotes.md` (VERDICT: APPROVED) + `story-verify sf-6` sạch B1-B3.

## 3. Touch map
- **Tạo (SỞ HỮU):** `frontend/remotes/tasks/**`, `frontend/remotes/activity/**`, `.github/workflows/remotes-tasks.yml`, `.github/workflows/remotes-activity.yml`, evidence `docs/superpowers/evidence/sf-6-fe-remotes/`.
- **Đụng có chủ (gap-answer ủy quyền BRIEF):** `platform/docker-compose.yml` — CHỈ thêm 2 entry `remote-tasks`/`remote-activity` (mirror entry `shell`: context repo root, healthcheck wget static).
- **READ-ONLY:** `frontend/shell/**`, `frontend/shared/**`, `pnpm-workspace.yaml`, `contracts/**`, `platform/conventions/*`, `platform/.env.example`, `platform/gateway/**`.
- **Shared-regen:** `pnpm-lock.yaml` (chung SF-5 — commit bình thường, coordinator resolve khi merge).
- **Consumers:** shell slots (registry :4001/:4002, expose names), gateway `/remotes/<name>/` route, CI, SF-7 e2e smoke.

## 4. Design
- **Approach:** mỗi remote = app Rspack + `ModuleFederationPlugin` (name `tasks`/`activity`, `filename: remoteEntry.js`, `exposes: {'./TasksPage'|'./ActivityPage'}`), `shared: {react, react-dom singleton}` với deps `catalog:`; standalone `index.html` + entry (dev mở trực tiếp :4001/:4002 debug được); page component nhận API base qua DefinePlugin `__API_BASE_URL__` (dev native: `http://localhost:3001`|`:8082`; prod: `''` same-origin qua gateway) — mirror shell `src/api.ts`; UI: list + form + inline error, tái dùng class `error-banner` phong cách shell; `publicPath` tuyệt đối dev (`http://localhost:4001/` — bài học spike) , prod relative `/remotes/<name>/`. **Remotes KHÔNG import react-router** (shell chỉ share react/react-dom — remote cần router hook thì phải thêm vào shared, tránh trùng instance; cả 2 trang đều không cần routing nội bộ).
- **Alternatives dismissed:** (A) hardcode URL API — vi phạm conventions/06; (B) 1 app 2 expose — phá registry/port table/boot-smoke per remote; (C) remote tự quản token — trùng tokenStorage, remote render trong shell nên cùng origin localStorage; (D) fetch raw thay fe-shared ApiClient — mất envelope decode + JWT, vi phạm spec slice mục 3.
- **Edge cases:** task title rỗng/>200 (client-side chặn + server 400 envelope → inline); node-svc 503 (spring down khi validate) → error message từ envelope; feed rỗng → empty state; stats lỗi → inline error, feed vẫn render; remote dev server đứng một mình (standalone index.html báo "chạy trong shell"); 1 remote down trong shell → error boundary shell-side + remote kia vẫn chạy (walkthrough test).
- **Non-functional:** a11y (label form, role=alert cho error — mirror shell); security (JWT không verify FE; không secret mới; title escape qua React mặc định); perf (singleton react, lazy remote từ shell-side); maintenance (2 remote cùng pattern, README standalone copy kèm fe-shared).

## 5. Implementation outline
- **File structure:** `frontend/remotes/<name>/` = `src/{index.tsx (standalone entry), bootstrap.tsx, api.ts, <Name>Page.tsx, components/*}`, `tests/*`, `rspack.config.mjs`, `package.json`, `tsconfig.json`, `index.html`, `vitest.config.ts`, `Dockerfile`, `nginx.conf`, `README.md`.
- **Testing strategy:** vitest + @testing-library/react mirror shell — mock fe-shared ApiClient (component test) + assert api call shape (api layer test); boot-smoke = CI docker (up + 200 + remoteEntry.js fetch). BROWSER VERIFY Rule 0 = walkthrough thật + screenshot.

### Tasks (10 — ordered, DAG)
| # | Task | Deps |
|---|------|------|
| 1 | Fit-check + probes: fe-shared exports đủ cho remote; đọc conventions 04/06/07 + shell nginx/Dockerfile pattern; **probe workspace-glob gap** (empirical: `pnpm m ls` sau scaffold thử nghiệm) → nếu gap thật: REQUIREMENT-GAP comment FI-62 + gap-answer 1 dòng globs (FLAG coordinator duyệt, không đụng catalog); **probe ĐỦ toolchain e2e (plan-critic P0-1): Postgres :5432 + `java`/JDK 21 (spring-svc mvnw) + `go` (go-svc) + node dev-scripts node-svc/auth-mock** — thiếu → cài portable user-local (~/Tools/sf6-e2e, không admin, xoá-là-sạch) + ghi escalation nếu vẫn thiếu | — |
| 2 | Scaffold `frontend/remotes/tasks/` — Rspack + MF remote + catalog singletons + standalone entry; dev :4001 hello page chạy được; workspace membership xanh | 1 |
| 3 | Tasks feature: api layer (list/create/update qua fe-shared ApiClient) + TasksPage UI (list + tạo + sửa status) + inline error envelope | 2 |
| 4 | Vitest `frontend/remotes/tasks` — component (mocked api) + api call shape | 3 |
| 5 | Scaffold `frontend/remotes/activity/` + api layer (feed/stats) + ActivityPage UI (feed render userName/taskTitle + stats tiles) | 2 |
| 6 | Vitest `frontend/remotes/activity` — component (mocked api) + api call shape | 5 |
| 7 | Dockerfile ×2 (nginx static, context repo root) + nginx.conf ×2 + README standalone ×2 | 4,6 |
| 8 | CI `remotes-tasks.yml` + `remotes-activity.yml` — typecheck + vitest + build + boot-smoke (up + 200 + fetch remoteEntry.js) | 7 |
| 9 | Compose: thêm ĐÚNG 2 entry `remote-tasks`/`remote-activity` (mirror `shell`, healthcheck wget static) — gap-answer BRIEF ủy quyền | 7 |
| 10 | E2E BROWSER VERIFY Rule 0: start native (postgres + auth-mock + node-svc + spring + go-svc + shell + 2 remotes) → login → tạo task → feed/stats phản ánh → remote-down case; screenshot evidence + ACCEPTANCE line-by-line + test-run.txt; TESTER REVIEW ĐỘC LẬP (code-reviewer → OUTBOX `/tmp/story/fi62/code-reviewer-sf-6-fe-remotes.md`) | 3,5,8,9 |

## 6. Risks & unknowns
- **[plan-critic P0-2 — GIẢI QUYẾT] Mâu thuẫn "qua gateway" vs native:** spec-slice mục 2 nói "native không cần CORS mở (dev proxy)" + ACCEPTANCE nói "qua gateway", NHƯNG conventions/07:5-7 + shell precedent (`API_BASE_URL` dev = service trực tiếp) + BRIEF.md:8 đều chốt native = gọi thẳng service port với CORS dev mở; gateway nginx KHÔNG chạy native được (không Docker). **Interpretation ghi REQUIREMENT-GAP FI-62:** e2e native của SF-6 đi thẳng service theo conventions/07; chân "qua gateway" do CI compose + SF-7 e2e smoke bảo chứng. KHÔNG tự sửa spec/conventions.
- **Workspace glob gap (Phase 0, plan-critic P1):** `frontend/remotes/*` KHÔNG có trong globs → `catalog:` protocol cần membership nên gap này là binary. Giải pháp gap-answer: thêm đúng 1 dòng globs (KHÔNG đụng catalog) + FLAG coordinator duyệt — nếu coordinator từ chối → toàn bộ singleton strategy phải rework, báo dừng.
- **Toolchain e2e (plan-critic P0-1):** máy KHÔNG có Java/Go/Postgres/Docker. Node-svc fail-closed 503 khi spring down → Rule 0 bắt buộc spring thật. Giải pháp: portable toolchain user-local `~/Tools/sf6-e2e/` (Temurin JDK 21 + Go 1.24 + Postgres 16 binaries — không admin, xoá-là-sạch); spring chạy qua `mvnw` (tự tải Maven); escalation nếu mvnw/JDK lệch version spring-svc yêu cầu → REQUIREMENT-GAP.
- **shell Dockerfile ảnh hưởng ở MERGE (coordinator):** lockfile mới có 2 importer `frontend/remotes/*` → Dockerfile shell (COPY từng package.json importer) cần thêm 2 dòng COPY khi merge — FLAG trong REQUIREMENT-GAP, SF-6 KHÔNG tự sửa.
- **Lockfile xung đột SF-5:** dự liệu sẵn — commit bình thường.
- **Assumption phải verify bằng đọc:** nginx.conf shell pattern (SPA fallback cho `/remotes/<name>/` static), 07-cors.md (CORS_DEV_ORIGIN set đúng khi start service native), Dockerfile-pattern conventions.

### T10 preflight checklist (plan-critic P1 — bắt buộc trước khi start e2e)
1. `CORS_DEV_ORIGIN=http://localhost:3000,http://localhost:4001,http://localhost:4002` trên node-svc + go-svc (+ spring).
2. **CÙNG MỘT `JWT_SECRET`** cho auth-mock + node-svc + spring-svc + go-svc (services tự verify — lệch secret = 401 toàn bộ).
3. Postgres roles/passwords đúng `.env.example` + init script SF-1 chạy trước migration.
4. Thứ tự boot: postgres → spring → node-svc → go-svc → auth-mock → shell → 2 remotes.
5. CI/boot-smoke exit criteria = structural mirror `shell.yml` (CI xanh quan sát ở story-level sau push — không Docker local).
