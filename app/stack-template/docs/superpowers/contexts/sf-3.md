# SF-3 Context Pack — go-svc Consumer + Saga + thanh lý ingest
> Đọc file này THAY VÌ tự tổng hợp. Epic spec: `docs/superpowers/specs/2026-10-13-kafka-outbox-saga.md` (rev 3). Mindmap: `docs/superpowers/mindmaps/kafka-outbox-saga.wakii`.
> Depends: SF-1 (env pre-add: KAFKA_BROKERS, AUTH_MOCK_URL, SVC_ACTIVITY_PASSWORD; golden fixtures; conventions/09).

## Spec slice (chỉ phần SF-3 chịu trách nhiệm)
1. **Cụm nguyên tử activity-side cascade**: migration `internal/store/migrations/0002_*.sql` — **`ALTER COLUMN action TYPE varchar(40)`** (`task.assignment_failed` = 22 ký tự > varchar(20) — chỉ sửa CHECK quên width = InsertEvent chết runtime, retry ×3 → DLQ sai nguyên nhân) + CHECK drop/recreate thêm `task.assigned`/`task.assignment_failed`.
2. **activity.yaml ×2 FILE** (P0 — sửa 1 bỏ 1 = docs endpoint lệch im lặng): canonical `contracts/openapi/activity.yaml` + snapshot nhúng `services/go-svc/internal/api/openapi/activity.yaml` — TRỌN GÓI: xóa `/events` path + `ActivityEventInput` + `EventAccepted`; enum action thêm `task.assigned`/`task.assignment_failed`; description bỏ "fire-and-forget"; stats keys thêm assignment_failed. **Thêm diff-guard 2 file vào `services-go-svc.yml`** (precedent: services-spring-svc.yml diff users.yaml).
3. `store/tasks.go` byStatus map thêm key `assignment_failed` (stats hiện hard-code 3 keys).
4. Consumer package `internal/consumer/`: `segmentio/kafka-go` (ADR ghi franz-go = path production), group `go-svc-activity`, manual commit SAU DB tx, **ON CONFLICT DO NOTHING bằng envelope id** (id do node sinh — đổi `store/events.go` InsertEvent nhận id từ envelope, bỏ `uuid.New()`), filter-by-type (bỏ qua `task.assignment_failed`), auto.offset.reset earliest. Test load golden fixture.
5. Retry ×3 (in-memory) → publish `task.assignment_failed` (envelope id MỚI do go sinh — go là producer lúc này) vào `task-events` → đẩy event gốc vào `task-events.dlq`.
6. Resolver service-token: boot login `svc-activity` (AUTH_MOCK_URL + SVC_ACTIVITY_PASSWORD env từ SF-1) — **retry backoff, KHÔNG crash nếu auth-mock chưa lên** (go chỉ depends_on postgres); lazy re-login khi 401/expiry; cache JWT cho resolver enrich userName.
7. Xóa `internal/api/events.go` ingest + route wiring + `events_test.go` cập nhật + integration test cập nhật (không còn POST /events — schemathesis step trong workflow cũng theo).
8. **`services-go-svc.yml` 3 điểm chạm + diff-guard (P0)**: (a) step event→feed→stats POST /events → thay bằng **kafka console producer publish golden fixture** (script trong image apache/kafka) + kafka vào subset boot + **tạo topic tường minh** (`kafka-topics.sh --create` task-events + dlq, 1 partition — không dựa auto-create); (b) stats assert exact-equality 3 keys → nới thêm assignment_failed; (c) giữ ≥1 proof event→feed (chống thoái hóa).
9. Simulate fail hook: assigneeId = svc-fail → consumer cố tình fail (deterministic cho e2e saga SF-5).
10. `internal/config/config.go` +KAFKA_BROKERS/group/DLQ/AUTH_MOCK_URL/SVC_ACTIVITY_PASSWORD; `model` +action constants; go.mod +segmentio.

## Touch map (files SF-3 tạo/sở hữu)
```
services/go-svc/**                    [SỞ HỮU — kể cả xóa ingest, thêm consumer]
contracts/openapi/activity.yaml       [SỬA — SF-3 sở hữu trọn gói]
services/go-svc/internal/api/openapi/activity.yaml [SỬA — snapshot ×2]
frontend/remotes/tasks/** (type + statusLabel + tests)  [SỞ HỮU — badge assignment_failed, P0 plan-critic gán đích danh]
frontend/remotes/activity/** (action labels + tests)    [SỞ HỮU]
.github/workflows/services-go-svc.yml [SỞ HỮU — 3 điểm chạm + diff-guard]
contracts/events/fixtures/*.json      [READ-ONLY — test load, KHÔNG sửa]
platform/docker-compose.yml           [READ-ONLY — env đã pre-add; kafka đã có; đụng = FLAG]
```

## ACCEPTANCE (user-visible)
- CI go-svc xanh: boot-smoke subset có kafka, publish golden fixture qua console producer → feed có row (proof event→feed), stats nới pass, diff-guard pass.
- Consumer unit: golden fixture → activity row đúng; duplicate envelope id → vẫn 1 row (idempotency).
- Retry/DLQ: simulate svc-fail → 3 retry → `task.assignment_failed` publish + event gốc vào DLQ (test assert).
- Resolver: enrich userName bằng service-token; auth-mock down lúc boot → không crash, retry; 401 → lazy re-login.
- GET /api/activity/events → 404 (ingest đã xóa); docs endpoint khớp contract (diff-guard).
- FE remote-tasks: task `assignment_failed` render badge đúng; remote-activity action label mới có.

## Boundary (KHÔNG làm)
- KHÔNG sửa compose/.env.example, contracts/events/**, conventions/09, contracts/db, tasks.yaml, node-svc, spring-svc (đụng = FLAG).
- KHÔNG đụng services-node-svc.yml (SF-2).
- KHÔNG dùng franz-go (segmentio theo spec; franz-go ghi ADR).
- KHÔNG SASL/SSL — PLAINTEXT compose-internal.
- KHÔNG thử docker/kafka local — CI verify.
