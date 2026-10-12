
## 2026-10-12 — SF-5 (FI-73) run
- **orca CLI id-capture gotcha (lặp lại FI-459 class)**: `run-create` trả top-level `id` = request id, run thật ở `.result.run.id` (format `run_*`); `gate-create` tương tự (`.result.gate.id`). task-create chấp nhận `--run <uuid-không-tồn-tại>` âm thầm → 9 tasks orphan trong run invisible. Suggested: task-create nên validate run id tồn tại; skill nên có helper capture id qua `.result.*` path thay vì grep-first-id. (learned-date 2026-10-12)
- **task-update status vocabulary**: `done` không hợp lệ — phải là `completed` (pending/ready/dispatched/completed/failed/blocked). Suggested: ghi rõ trong SKILL.md Phase 4 examples. (learned-date 2026-10-12)
- **story-plan-validate encode lỗi trên Windows**: cần `PYTHONIOENCODING=utf-8` khi output có tiếng Việt (cp1252 UnicodeEncodeError). Suggested: set trong script itself. (learned-date 2026-10-12)
