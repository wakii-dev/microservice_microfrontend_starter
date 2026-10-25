# SF-3 Plan — go-svc Consumer + Saga + thanh lý ingest (FI-80)

> Story FI-76 · spec slice: `docs/superpowers/contexts/sf-3.md` · epic spec rev 3: `docs/superpowers/specs/2026-10-13-kafka-outbox-saga.md`
> Worktree: `sf-3-go-consumer` (nhánh `__STACK_ORG__/sf-3-go-consumer` fork từ dest @8d04e6d — SF-1 đã merge)
> Ràng buộc: dev machine KHÔNG Go/Docker — build/test/kafka verify QUA CI. KHÔNG sửa compose/.env.example/contracts-events/conventions-09/users.json/tasks-schema/tasks.yaml/node/spring. KHÔNG franz-go (segmentio theo spec).

## Tasks (11)

- [ ] T1 — Migration `0002_widen_action_cascade.sql`: `ALTER COLUMN action TYPE varchar(40)` (`task.assignment_failed` = 22 ký tự) + drop CHECK cũ / recreate CHECK 5 giá trị (thêm `task.assigned`, `task.assignment_failed`). Width + CHECK CÙNG file — P0 ×2.
- [ ] T2 — Store idempotency: `store/events.go` InsertEvent `INSERT ... ON CONFLICT (id) DO NOTHING` (id = envelope id từ caller); `model/model.go` +action constants; `store/tasks.go` byStatus + `api/stats.go` seed map thêm `assignment_failed`.
- [ ] T3 — Config: +`KafkaBrokers` (required fail-fast), `KafkaGroup` (default `go-svc-activity`), `KafkaTopic` (default `task-events`), `KafkaDLQTopic` (default `task-events.dlq`), `AuthMockURL`, `SvcActivityPassword`; +`config_test.go`.
- [ ] T4 — Resolver service-token: token source login `svc-activity` (`AUTH_MOCK_URL` + `SVC_ACTIVITY_PASSWORD`) — retry backoff lúc boot KHÔNG crash (go chỉ depends_on postgres), lazy re-login khi 401/expiry, cache JWT; consumer enrich userName bằng token này. Tests: fake auth server (backoff, 401 → re-login).
- [ ] T5 — Consumer package `internal/consumer/` (segmentio/kafka-go): parse envelope (schemaVersion 1, 5 type), filter-by-type bỏ qua `task.assignment_failed`, handler = [1 DB tx: INSERT activity idempotent + resolve display] SAU ĐÓ commit offset (manual commit sau tx); simulate fail hook `assigneeId == svc-fail UUID` → error; retry ×3 in-memory backoff → publish `task.assignment_failed` (envelope id MỚI do go sinh) vào `task-events` + push message gốc vào `task-events.dlq`. Tests: load golden fixtures (READ-ONLY), idempotency, retry/DLQ (fake producer).
- [ ] T6 — Wiring + thanh lý ingest: `main.go` chạy consumer goroutine (lazy connect); router bỏ `/events` + `EventsHandler`; XÓA `internal/api/events.go` + `events_test.go`; integration test cập nhật (POST /events → 404; idempotency trên postgres thật; giữ readonly-exit criterion).
- [ ] T7 — activity.yaml ×2 FILE (P0 — sửa 1 bỏ 1 = docs lệch im lặng): canonical `contracts/openapi/activity.yaml` + snapshot `services/go-svc/internal/api/openapi/activity.yaml` GIỮ BIT-IDENTICAL: xóa `/events` path + `ActivityEventInput` + `EventAccepted` + tag events; `ActivityFeedItem.action` enum 5 giá trị; description bỏ "fire-and-forget" (Kafka consumer); `tasksByStatus` thêm `assignment_failed`.
- [ ] T8 — CI `services-go-svc.yml` 3 điểm chạm + diff-guard: (a) boot-smoke subset +kafka, `kafka-topics.sh --create` task-events + dlq tường minh, console producer publish golden fixture (exec trong container), poll feed đến khi có row (proof event→feed); (b) stats assert nới 4 keys exact; (c) giữ ≥1 proof event→feed; + job drift-guard diff 2 file yaml (precedent spring drift-guard); paths filter + contracts/openapi/activity.yaml; bỏ step POST /events.
- [ ] T9 — FE remote-tasks: `Task.status` → `TaskStatusExtended` (4 giá trị); `STATUS_LABELS` +`assignment_failed` ('Gán thất bại'); select CHỈ 3 writable; badge khi `assignment_failed`; tests cập nhật. Remote-activity: `ACTION_LABELS` +`task.assigned`/`task.assignment_failed`; `ActivityStats.tasksByStatus` +key; tests cập nhật.
- [ ] T10 — go-svc README (consumer + env mới + saga flow) + verify local static (yaml parse ×2 identical, fixtures JSON, gofmt qua CI) + push + CI watch xanh (boot-smoke kafka MỚI).
- [ ] T11 — TESTER REVIEW ĐỘC LẬP → verdict `/tmp/story/fi62/code-reviewer-sf-3-go-consumer.md` (VERDICT: APPROVED + evidence, CHECKLIST-4Q); evidence `docs/superpowers/evidence/sf-3-go-consumer/test-run.txt`; Linear comment DONE (hash + CI URL + files); story-verify sf-3 (B1-B3). KHÔNG set Done, KHÔNG merge dest.

## Acceptance (user-visible — từ context pack sf-3.md)
1. CI go-svc xanh: boot-smoke subset có kafka, console producer publish golden fixture → feed có row, stats nới pass, diff-guard pass.
2. Consumer unit: golden fixture → activity row đúng; duplicate envelope id → vẫn 1 row (idempotency).
3. Retry/DLQ: simulate svc-fail → 3 retry → `task.assignment_failed` publish + event gốc vào DLQ.
4. Resolver: enrich userName bằng service-token; auth-mock down lúc boot → không crash; 401 → lazy re-login.
5. GET /api/activity/events → 404; docs endpoint khớp contract (diff-guard).
6. FE remote-tasks badge `assignment_failed` đúng; remote-activity action label mới có.

## Boundary (KHÔNG làm)
- compose/.env.example, contracts/events/**, conventions/09, contracts/db, tasks.yaml, node-svc, spring-svc, services-node-svc.yml — đụng = FLAG.
- KHÔNG SASL/SSL; KHÔNG kafka vào readyz/depends_on; KHÔNG thử docker/kafka local — CI verify.
