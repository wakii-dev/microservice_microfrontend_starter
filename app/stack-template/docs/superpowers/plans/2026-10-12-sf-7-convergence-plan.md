# Plan: SF-7 Convergence & Scaffold
Date: 2026-10-12 | Linear: FI-75 | Worktree: sf-7-convergence | Story: FI-62

## 0. Root cause analysis (WHY — before "what")
### Root cause
SF-1..6 xây song song, mỗi SF chỉ chứng minh phần mình → không artifact committed nào chứng minh CHUỖI login→tạo task→đọc feed chạy liền mạch; docs viết ở thời SF-1 đã lệch thực tế; không có đường fresh-clone→demo cho người copy; không có scaffold; chưa có security-audit hội tụ.
### Current state (before feature)
dest @ec7c3d3: 6 services impl + CI per-stack xanh + browser e2e SF-6 verify native (evidence sf-6). scripts/ KHÔNG tồn tại. README stale ("khung rỗng, SF-2/3/4 điền"). Compose: 3 service BE chưa có healthcheck, chưa có health-gated chain.
### Expected outcome
Người copy: fresh-clone → đọc walkthrough → chạy demo được; CI chứng minh e2e + copy-dir + scaffold; scaffold sinh project mới tên riêng chạy được cùng flow; 0 P0/P1 security.
### Constraints & hardships
Dev machine KHÔNG Docker (verify local native; docker compose chỉ qua CI) · browser KHÔNG vào CI (human gate) · services/frontend READ-ONLY · compose CHỈ được sửa phần health-gated · go-svc distroless không có shell/wget → healthcheck in-container bất khả không đụng Dockerfile (đã probe) → go-svc dùng `service_started` + e2e retry, flag story-level.
### High-level strategy
Hội tụ tại chỗ: chứng minh bằng script + CI job mới (file convergence riêng), docs đồng bộ, scaffold copy-thuần. Không re-architect, không thêm tính năng.

## 1. Problem (intent, NOT solution)
Người mua boilerplate chưa thể tin chuỗi e2e chạy được (không proof committed), chưa chứng minh copy-dir standalone, chưa có script sinh project mới, docs không dẫn được người mới từ fresh-clone đến demo.

## 2. Scope
- In scope: scripts/smoke/e2e.sh · CI convergence.yml (3 job: e2e-smoke, copy-dir-smoke, scaffold-verify) · compose health-gated (chỉ healthcheck+depends_on) · docs (ADR ×7, toolchain, walkthrough, README sync) · scripts/scaffold/ · 2 findings SF-1-owned (conventions/02 mirror rule; DDL CREATE SCHEMA note) + [p6-flag] sync (01, 08) · security-audit checkpoint · Rule 0 native smoke + evidence.
- Out of scope: browser trong CI; fix business logic services/FE; merge main/PR; tính năng mới; sửa workflow-templates (READ-ONLY — thiếu gì = flag).
- Success criteria (observable): xem ACCEPTANCE context pack sf-7.md — từng dòng verify tại Task 10; CI 3 job mới xanh sau push; story-verify B1-B3 sạch.

## 3. Touch map
- Files modify: `scripts/smoke/e2e.sh` (tạo) · `scripts/scaffold/scaffold.sh` + README (tạo) · `.github/workflows/convergence.yml` (tạo) · `docs/adr/*` + `docs/toolchain.md` + `docs/walkthrough.md` (tạo) · `README.md` (sửa) · `platform/docker-compose.yml` (sửa — chỉ healthcheck/depends_on) · `platform/conventions/01|02|08` (sửa — sync) · `contracts/db/tasks-schema.sql` (sửa — comment-only) · `docs/superpowers/evidence/sf-7-convergence/*` (tạo).
- Consumers/regression candidates: CI workflows hiện có (contracts.yml, per-service) — file mới không được phá chúng; SF-6 native mode — compose sửa không ảnh hưởng native; SF-1 compose pre-seed — sửa giữ nguyên entry/env.
- Shared surfaces: compose env vars (không thêm biến mới); healthcheck endpoints /readyz đã có sẵn ở cả 3 service (conventions/02).

## 4. Design
- Approach chosen: A — smoke curl thuần + CI compose; scaffold copy+rename+prune. (B browser-CI, C generator — dismissed theo spec.)
- Alternatives considered: jq trong e2e.sh (dismissed — giữ curl+grep thuần chạy được Git Bash không jq); go-svc healthcheck bằng sửa Dockerfile (dismissed — READ-ONLY, flag story-level).
- Edge cases / second-order effects:
  - go-svc distroless → gateway `depends_on: go-svc: service_started`; e2e.sh retry feed tối đa N lần (chống race go-svc init chậm hơn gateway-ready).
  - CI compose `${VAR:?}` fail hard → job sinh `.env` đầy đủ từ placeholder CI (không secret thật).
  - Scaffold rename `@boilerplate/*` phá pnpm-lock importers → scaffold chạy `pnpm install --no-frozen-lockfile` ghi trong hướng dẫn + job verify dùng flag đó.
  - e2e re-run: title prefix `smoke-<epoch>` tránh trùng dữ liệu cũ.
- Non-functional: security (secrets/exec-bit/lockfile — checkpoint riêng); perf/a11y/i18n — skip (không UI mới, không hot path).

## 5. Implementation outline
- Tasks (ordered, DAG):
  1. `docs-sync` — conventions/02 mirror rule + DDL CREATE SCHEMA note + conventions/01 standalone-lockfile variant + conventions/08 requiredVersion:false. Conditional: 04-error-envelope chỉ ghi note nếu quyết additionalProperties ĐÃ chốt ở node-svc source — KHÔNG tự chốt, chưa chốt thì flag. Exit: 2 findings SF-1-owned xử lý xong + [p6-flag] sync xong.
  2. `smoke-script` — scripts/smoke/e2e.sh (login→POST task assignee bob→feed poll 10×1s có action task.created + title; stats fetch baseline TRƯỚC khi tạo, assert ≥ baseline+1; wait poll /api/auth/readyz qua :8080; env GATEWAY_URL/SMOKE_*; title prefix smoke-<epoch>). **T2 TỰ verify exit của mình: tự start native stack từ ~/Tools/sf6-e2e (script biến thể SF-7 trỏ worktree này) rồi chạy script thật** — không đợi T10. Exit: script chạy THẬT native tại T2 + exit-code đúng từng bước fail.
  3. `compose-health` — healthcheck node/spring (wget /readyz — alpine busybox, ĐÃ PROBE); KHÔNG healthcheck gateway (nginx không route /readyz — P1 critic vòng 2, probe sẽ 404 deadlock); depends_on: node→spring healthy; gateway → auth-mock+node+spring service_healthy, go-svc service_started (distroless NGOẠI LỆ có chủ đích — P0 spec-critic; readiness go-svc do e2e poll stats). **+ spec slice #6 (P0 plan-critic): rà multi-stage + pinned base images toàn bộ 6 Dockerfile (3 svc + auth-mock + shell + 2 remotes) — report status vào evidence, KHÔNG sửa trừ khi P0.** Exit: `docker compose --env-file platform/.env.example config -q` pass + banner ownership SF-7 + **git diff compose chỉ chạm healthcheck/depends_on/banner (diff-guard)** + report multi-stage/pinned.
  4. `ci-smoke` — convergence.yml job e2e-smoke: reuse `--env-file platform/.env.example` → compose up -d --build → poll /api/auth/readyz qua :8080 → bash scripts/smoke/e2e.sh → khi fail dump logs (compose gọi lại CÙNG --env-file — p6-flag SF-2). Trigger branches:** + workflow_dispatch. File convergence.yml RIÊNG, không đụng workflow-templates. Exit: workflow YAML hợp lệ (CI push là gate thật).
  5. `ci-copydir` — job copy-dir-smoke: copy services/node-svc ra tmp: pnpm install --ignore-workspace + test + build (theo README standalone); copy frontend/shared ra tmp: tsc --noEmit typecheck (fe-shared KHÔNG có scripts riêng — inert cho node-svc, ghi tường minh trong job; proof FE mạnh hơn = follow-up). Exit: job định nghĩa, lệnh khớp README từng repo-con.
  6. `scaffold` — scripts/scaffold/scaffold.sh (cp/tar-based KHÔNG rsync; prune .git/.github/workflow-templates/docs/superpowers/spike/node_modules/.story-brief.md + workflows/convergence.yml; rename @boilerplate→@<name> + root package name + compose name + README title; xử lý pnpm-lock importers strip spike + rename scope; ghi SCAFFOLD.md kèm full-e2e human gate note). Exit: chạy local Git Bash ra project mới; **"diff sạch" = output tree khớp expected** — không rò .git/.github/workflow-templates/docs/superpowers/frontend/spike/node_modules/.story-brief.md/workflows-convergence.yml; rename @boilerplate đủ trong package.json + lockfile importers.
  7. `ci-scaffold` — job scaffold-verify: scaffold --name demo-app → pnpm install --no-frozen-lockfile → build FE shell + `docker compose -f <out>/platform/docker-compose.yml --env-file <out>/platform/.env.example config -q` trong output. Narrowing đã duyệt (context pack: "CI verify scaffold output build được") — full e2e trên output = human gate. Exit: convergence.yml parse OK + **step-sequence job khớp SCAFFOLD.md do T6 output** (scaffold → install → build → compose config).
  8. `adr-toolchain` — docs/adr/ (7 quyết định: mixed-stack, MF-Rspack, contract-first, readonly-schema, fail-closed, fire-and-forget, fork-not-upgrade) + README index + docs/toolchain.md. Exit: đủ 7 ADR khớp danh sách spec.
  9. `readme-walkthrough` — README sync (kiến trúc 6 svc thật, mục Chạy compose+native+smoke, repo map mới) + docs/walkthrough.md fresh-clone checklist. Exit: lệnh walkthrough **khớp script e2e.sh (T2) + lệnh native đã chạy tay tại T2**; không còn text stale SF-1. T10 chỉ reconcile lệch (nếu có).
  10. `verify-evidence` — Rule 0: tái dùng native stack đã sống từ T2 → chạy e2e.sh chính thức + evidence docs/superpowers/evidence/sf-7-convergence/test-run.txt; verify từng dòng ACCEPTANCE; browser walkthrough = **human gate — chỉ GHI hướng dẫn cho user, evidence note "human-gate pending user"** (P2 plan-critic); security-audit agent; code-reviewer độc lập; commit + push. **Exit: VERDICT APPROVED + evidence /tmp/story/fi62/code-reviewer-sf-7-convergence.md + CI convergence.yml 3/3 job XANH sau push (hoặc FAIL-flag kèm run link) + fix-commits (nếu audit/review sinh fix) commit TRƯỚC, evidence là commit cuối (chống B1 hash flip — improvements-log SF-6).** Fix-loop 2 nhánh: issue trong artifacts SF-7 → fix tại T10; issue trong services/FE (READ-ONLY) → report coordinator.
- File structure: scripts/ (mới, root) · docs/adr/ (mới) · giữ conventions của platform/.
- **Execution-order contract (P1 plan-critic):** DAG thực chỉ có T10←T1,T5 (task-update không hỗ trợ thêm deps) — **T10 CHỈ chạy sau T4,T7,T9: coordinator-enforced khi inline**; nếu bất kỳ task bị dispatch ra worker/rollback giữa chừng, coordinator phải kiểm T4/T7/T9 completed trước khi mở T10.
- Testing strategy: e2e.sh chạy thật native TỪ T2 (stack tự start) + CI job chạy lại trên compose (gate thật) · `docker compose config` cho compose · scaffold chạy local thật · docs walkthrough khớp lệnh đã chạy (không test tự động — ghi rõ).
- Numbering đối chiếu (P2 critic): DAG task id ↔ plan numbering — T1 docs-sync=task_6fa252c9274a · T2 smoke=task_34b7de0c22bf · T3 compose=task_ecf7929531ca · T4 ci-smoke=task_aa83884a9e64 · T5 copydir=task_6e21f4739d17 · T6 scaffold=task_7daa14f8c2ad · T7 ci-scaffold=task_62413473ffd1 · T8 adr=task_e984c41cafd5 · T9 readme=task_dafd27e9aa62 · T10 verify=task_5cab41e0ee8f.

## 6. Risks & unknowns
- Must verify: Dockerfile base images (ĐÃ PROBE: node alpine wget ✓, spring temurin-alpine wget ✓, go distroless ✗ → service_started + e2e poll; gateway KHÔNG healthcheck — probe sẽ 404) · event action string (ĐÃ PROBE: 'task.created' tại node-svc/src/routes/tasks.ts:134) · README standalone node-svc (ĐÃ PROBE: local lockfile + --ignore-workspace) · toolchain ~/Tools/sf6-e2e (ĐÃ PROBE: còn sống).
- Unverified assumptions: frontend/shared tsc --noEmit đứng độc lập ngoài workspace (probe tại Task 5) · gateway nginx route /api/activity/feed không đổi path (probe contracts đã xác nhận servers /api/activity).
- CI env: compose reuse `--env-file platform/.env.example`; lockfile scaffold strip spike importers + rename scope (xem plan T6).
