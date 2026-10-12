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
