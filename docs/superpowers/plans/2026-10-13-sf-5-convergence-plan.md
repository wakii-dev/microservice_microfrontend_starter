# Plan — SF-5 Convergence + ADR sync + docs (FI-81, story FI-76)

> Context pack: `docs/superpowers/contexts/sf-5.md` · Epic spec rev 3 §Tier 2 · Branch `wakii-dev/sf-5-convergence` @f23d217.
> Verify: CI-only (máy dev không Docker) — push + `gh run watch` convergence. Services/FE/contracts READ-ONLY.

## Tasks

^- [x] T1 — `scripts/smoke/e2e.sh` saga path: PATCH task assigneeId = svc-fail fixture (55555555-5555-4555-8555-555555555555) → poll GET task `status=assignment_failed` → assert DLQ: `kafka-console-consumer` trong container kafka đọc `task-events.dlq` thấy message chứa taskId gốc. Poll nới (feed 30s, saga 60s). Opt-out `SMOKE_SAGA=0` cho đường B native không Kafka. `bash -n` sạch.
^- [x] T2 — `.github/workflows/convergence.yml`: e2e job boot đủ 10 services (kafka vào title), tạo topic tường minh `task-events` + `task-events.dlq` (`--if-not-exists`, wait kafka healthy) trước e2e, timeout 20→30 phút, dump khi fail thêm DLQ + consumer logs (node/go).
^- [x] T3 — `docs/walkthrough.md`: saga demo (assign fail@demo.local → badge/status `assignment_failed` + lệnh đọc DLQ), note Flyway V2 seed chạy 1 lần — pgdata volume CŨ thiếu svc users → `docker compose down -v` sau pull, CI table convergence 10 services 2 chiều, note SMOKE_SAGA cho đường B.
^- [x] T4 — `README.md` sync lần cuối: 3 service + compose mô tả khớp thực tế (kafka/outbox/saga) — chỉ sửa chỗ lệch.
^- [x] T5 — ADR-0008 consistency rà vs code thật (segmentio, envelope, presence-based, retry in-memory ×3, DLQ shape) — sửa ADR nếu lệch.
^- [x] T6 — Security pass cuối: 9092 không expose host; JWT_SECRET/passwords không vào envelope/event payload/DLQ; `.env` không trong git.
- [ ] T7 — CI convergence xanh 4/4 jobs (e2e 2 chiều + copy-dir + scaffold) — push + `gh run watch`.
- [ ] T8 — Evidence `docs/superpowers/evidence/sf-5-convergence/test-run.txt` (HEAD code commit + `tdd: skipped-tdd: CI-only`), tester review độc lập, comment FI-81, story-verify.

## Boundary

- services/*, frontend/*, contracts/* READ-ONLY — bug thấy được = report coordinator (step 7 context pack).
- KHÔNG merge main / KHÔNG PR / KHÔNG set Linear Done (coordinator làm).
- compose: chỉ health-gated depends_on nếu cần — còn lại FLAG.
