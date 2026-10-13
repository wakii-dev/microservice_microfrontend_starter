# SF-5 Context Pack — Convergence + ADR sync + docs
> Đọc file này THAY VÌ tự tổng hợp. Epic spec: `docs/superpowers/specs/2026-10-13-kafka-outbox-saga.md` (rev 3). Mindmap: `docs/superpowers/mindmaps/kafka-outbox-saga.wakii`.
> Depends: SF-2, SF-3, SF-4 (SF-1 transitively). Dest khi bạn fork đã đủ SF-1..4.

## Spec slice (chỉ phần SF-5 chịu trách nhiệm)
1. `.github/workflows/convergence.yml`: boot **10 services** (kafka thêm vào), KAFKA_HEAP_OPTS nếu cần, **poll budget nới** (outbox 500ms + Kafka latency — e2e poll hiện RETRIES×1s còn dư nhưng kiểm chứng), copy-dir giữ contracts/db (outbox KHÔNG vào canonical — chỉ schema tasks là cross-service contract).
2. `scripts/smoke/e2e.sh` **2 chiều**:
   - Happy path (có sẵn): login → tạo task → poll feed (qua outbox+Kafka — nới window).
   - **Saga path (mới)**: PATCH task assigneeId = svc-fail → poll GET task status = `assignment_failed` → **assert DLQ: `kafka-console-consumer` (trong container kafka) đọc `task-events.dlq` thấy event gốc** — acceptance #3 đủ 2 nửa.
3. FE remotes verify tổng thể trên stack thật (SF-3 đã sửa tests/tile/badge — bạn verify happy + saga path render đúng, screenshot/browser theo Rule 0 nếu có thể; else curl + CI evidence).
4. Docs sync: walkthrough (thêm saga demo + **note Flyway V2 seed chạy 1 lần — pgdata volume CŨ thiếu svc users → `docker compose down -v` sau pull**), README 3 service + compose, rà ADR-0008 consistency với code thật.
5. Security pass cuối: 9092 không expose host, secrets (JWT_SECRET, passwords) không vào envelope/event payload, `.env` không commit.
6. Scaffold probe: `scaffold.sh` copy `platform/` nguyên khối → kafka entry + .env.example tự flow; chạy compose config -q trên output (convergence scaffold-verify job hiện có).
7. Report (KHÔNG fix) bug product thấy được trong services/FE — SF sở hữu fix.

## Touch map (files SF-5 tạo/sở hữu)
```
scripts/smoke/e2e.sh                  [SỞ HỮU]
.github/workflows/convergence.yml     [SỞ HỮU — convergence touch points]
docs/** (walkthrough, ADR consistency) [SỞ HỮU]
README.md                             [SỬA lần cuối]
platform/docker-compose.yml           [SỬA CHỈ health-gated depends_on nếu cần — còn lại flag]
services/*, frontend/*, contracts/*   [READ-ONLY toàn bộ — bug = report coordinator]
```

## ACCEPTANCE (user-visible)
- CI convergence xanh: compose 10 services + e2e 2 chiều (happy + saga kèm DLQ assert) + copy-dir standalone.
- Saga e2e: assign svc-fail → task `assignment_failed` VÀ event gốc trong `task-events.dlq` (kafka-console-consumer assert).
- Walkthrough fresh-clone đọc được một người mới chạy từ đầu (kèm note down -v cho volume cũ).
- Security pass: 0 P0/P1.

## Boundary (KHÔNG làm)
- KHÔNG fix business logic services/FE (report coordinator).
- KHÔNG merge vào main / KHÔNG tạo PR (coordinator làm).
- KHÔNG thêm tính năng mới — hội tụ + chứng minh.
- KHÔNG thử compose local — CI verify; browser walkthrough = human gate tại checkpoint (ghi hướng dẫn cho user).
