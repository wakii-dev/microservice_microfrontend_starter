# Improvements Log (Principle 6 — flag, KHÔNG tự sửa skill)

| Date | Task | What | Where | Suggested change |
|------|------|------|-------|------------------|
| 2026-10-12 | FI-71 (SF-3) | `story-plan-validate` W1 báo "spec không có tiêu chí nghiệm thu" dù task spec có dòng `Exit: …` — keyword grep không khớp format "Exit:" | ~/.claude/bin/story-plan-validate | Thêm pattern `Exit:`/`tiêu chí` vào detector W1 |
| 2026-10-12 | FI-71 (SF-3) | orca CLI rất chậm (~10-15s/call) — batch task-create 9 task vượt timeout 120s phải chạy background; task-update tương tự | orca orchestration | Không phải skill bug — ghi nhận để batch lệnh orca vào 1 lệnh background từ đầu |
| 2026-10-12 | FI-71 (SF-3) | Gotcha TDD-in-CI: dev machine không JDK/Docker → `tdd: RED→GREEN` bất khả thi; convention B1+ nên có dạng `tdd: skipped-tdd: CI-only <reason>` chuẩn hoá | post-task-ritual / kit evidence convention | Ghi shape evidence cho CI-only runs |
| 2026-10-12 | FI-71 (SF-3) | openapi-generator `interfaceOnly` KHÔNG gắn class-level base path — implementor phải tự thêm `@RequestMapping("${openapi.<svc>API.base-path:/api/<svc>}")` (root cause 1 vòng CI) | SF-2 node-svc (nếu dùng pattern tương tự), kit patterns | Ghi pattern vào conventions hoặc plan template cho service codegen sau |

## 2026-10-12 — SF-2 node-svc (FI-70)
- [p6-flag] `.github/workflow-templates/services-ci.yml.example` (SF-1 sở hữu): pnpm/action-setup@v4 fail ERR_PNPM_BAD_PM_VERSION khi workflow khai `version:` trùng với `packageManager` trong package.json — nên comment hướng dẫn bỏ `version` khi repo đã pin packageManager. Gặp ở run 38227939477.
- [p6-flag] conventions/01-dockerfile-pattern.md: pattern `COPY pnpm-lock.yaml` bất khả thi cho workspace member (build context = thư mục con, root lockfile ngoài context) — cần thêm variant "local standalone lockfile" (auth-mock precedent). Đã fix trong services/node-svc (spec D2), conventions cần sync ở SF-7.
- [p6-flag] drizzle-orm migrator (node-postgres, 0.44) luôn phát `CREATE SCHEMA IF NOT EXISTS "<migrationsSchema>"` — cần CREATE trên DATABASE, không chỉ schema → với per-service DB role (grant schema-only) boot crash. Pattern fix: custom SQL runner skip CREATE SCHEMA khi to_regnamespace tồn tại (services/node-svc/src/db/migrate.ts). Nên thành ADR/knowledge cho SF-3 (Flyway không vấn đề này nhưng Spring Boot role-only grant tương tự).
- [p6-flag] CI log-dump step gọi lại `docker compose` phải truyền cùng `--env-file` nếu không interpolation fail che mất log thật (run 38228924847). services-ci.yml.example nên note.
- [p6-flag] Fastify v5: pino ≥9.14 `Logger` type không gán được vào `loggerInstance` (thiếu msgPrefix) — cast qua FastifyBaseLogger; HttpError phải expose field `statusCode` (không phải `status`) để error handler đọc. P2 chờ: additionalProperties:false chặt hơn contract OpenAPI mặc định — cần quyết chung cho 3 service (FE decodeErrorEnvelope phụ thuộc code catalog).

## 2026-10-12 — SF-4 go-svc (FI-72)

1. **story-plan-validate crash cp1252** — `~/.claude/bin/story-verify` và `story-plan-validate` crash `UnicodeEncodeError` khi task spec chứa tiếng Việt trên Windows (PYTHONIOENCODING=utf-8 workaround được). Suggested: script set `sys.stdout.reconfigure(encoding='utf-8')` sẵn. (bin: story-plan-validate, story-verify)
2. **orca orchestration task-create rapid-fire fail** — 9 task-create gọi liên tiếp không sleep → tất cả fail `ok:false` không 'result' (mutation lock/rate?). Suggested: skill hướng dẫn pacing ≥3-4s giữa các mutation call hoặc batch API. (skill: orca-superpowers-workflow Phase 3 DAG wiring)
3. **story-verify B4 vs SF checklist "KHÔNG merge"** — B4 check "HEAD là ancestor của story dest" nhưng SF executor bị cấm merge (brief bước 3) → B4 luôn FAIL ở executor handoff; "sạch" chỉ đạt được sau khi story-hub merge. Suggested: story-verify thêm flag `--executor-view` (B4 report PENDING-MERGE thay vì FAIL khi SF chưa report merged). (bin: story-verify)
4. **schemathesis + healthcheck paths** — spec OpenAPI khai /healthz+/readyz dưới servers.url prefix nhưng conventions quy định naked path → schemathesis 404. Auth-mock precedent = mirror cả hai dạng; SF-4 phải tự discover điều này (tốn 1 vòng CI). Suggested: conventions/02 ghi rõ mirror rule cho MỌI service mới. (doc: platform/conventions/02-healthcheck.md — SF-1 sở hữu, flag lên coordinator)
5. **CREATE SCHEMA IF NOT EXISTS permission-denied** — role có CREATE trên schema nhưng không có CREATE trên database → CREATE SCHEMA IF NOT EXISTS vẫn denied dù schema tồn tại. Canonical DDL nên tách CREATE SCHEMA khỏi phần table (hoặc note cho CI apply-as-role). (doc: contracts/db/tasks-schema.sql — SF-1 sở hữu)

## 2026-10-12 — SF-5 (FI-73) run
- **orca CLI id-capture gotcha (lặp lại FI-459 class)**: `run-create` trả top-level `id` = request id, run thật ở `.result.run.id` (format `run_*`); `gate-create` tương tự (`.result.gate.id`). task-create chấp nhận `--run <uuid-không-tồn-tại>` âm thầm → 9 tasks orphan trong run invisible. Suggested: task-create nên validate run id tồn tại; skill nên có helper capture id qua `.result.*` path thay vì grep-first-id. (learned-date 2026-10-12)
- **task-update status vocabulary**: `done` không hợp lệ — phải là `completed` (pending/ready/dispatched/completed/failed/blocked). Suggested: ghi rõ trong SKILL.md Phase 4 examples. (learned-date 2026-10-12)
- **story-plan-validate encode lỗi trên Windows**: cần `PYTHONIOENCODING=utf-8` khi output có tiếng Việt (cp1252 UnicodeEncodeError). Suggested: set trong script itself. (learned-date 2026-10-12)

## 2026-10-12 — SF-6 FE remotes (FI-74)
- **fe-shared loadRemoteModule defect** (mf-bootstrap.ts): native `import()` với specifier BIẾN không được bundler rewrite; runtime API `loadRemote` cần key không có './' prefix. Bug tiềm ẩn suốt SF-1/SF-5 vì chỉ test remote-DOWN. Suggested change: SF-1 thêm unit characterization test + ghi pattern vào fe-shared README. (Đã fix + FLAG, commit c81309d.)
- **pnpm `catalog:` literal rò vào mf-enhanced requiredVersion** — singleton remote nên khai `requiredVersion: false` tường minh. Suggested: conventions/08 thêm 1 dòng.
- **story-guard-secrets hook**: chặn inline `JWT_SECRET=...` kể cả khi có WAKII_GUARD_OFF=1 inline — cần export qua script file. Suggested: hook tôn trọng WAKII_GUARD_OFF inline hoặc docs ghi rõ cách override.
- **evidence hash gate (B1)**: test-run.txt phải ghi HEAD tại lúc ghi (hash đổi sau commit mới → B1 flip FAIL). Suggested: story-verify chấp nhận docs-only commit sau evidence hash.
