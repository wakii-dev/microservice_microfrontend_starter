# Improvements Log (Principle 6 — flag, KHÔNG tự sửa skill)

| Date | Task | What | Where | Suggested change |
|------|------|------|-------|------------------|
| 2026-10-12 | FI-71 (SF-3) | `story-plan-validate` W1 báo "spec không có tiêu chí nghiệm thu" dù task spec có dòng `Exit: …` — keyword grep không khớp format "Exit:" | ~/.claude/bin/story-plan-validate | Thêm pattern `Exit:`/`tiêu chí` vào detector W1 |
| 2026-10-12 | FI-71 (SF-3) | orca CLI rất chậm (~10-15s/call) — batch task-create 9 task vượt timeout 120s phải chạy background; task-update tương tự | orca orchestration | Không phải skill bug — ghi nhận để batch lệnh orca vào 1 lệnh background từ đầu |
| 2026-10-12 | FI-71 (SF-3) | Gotcha TDD-in-CI: dev machine không JDK/Docker → `tdd: RED→GREEN` bất khả thi; convention B1+ nên có dạng `tdd: skipped-tdd: CI-only <reason>` chuẩn hoá | post-task-ritual / kit evidence convention | Ghi shape evidence cho CI-only runs |
| 2026-10-12 | FI-71 (SF-3) | openapi-generator `interfaceOnly` KHÔNG gắn class-level base path — implementor phải tự thêm `@RequestMapping("${openapi.<svc>API.base-path:/api/<svc>}")` (root cause 1 vòng CI) | SF-2 node-svc (nếu dùng pattern tương tự), kit patterns | Ghi pattern vào conventions hoặc plan template cho service codegen sau |
