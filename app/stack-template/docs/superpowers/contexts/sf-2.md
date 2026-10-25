# SF-2 Context Pack — node-svc Outbox + Producer + compensation consumer
> Đọc file này THAY VÌ tự tổng hợp. Epic spec: `docs/superpowers/specs/2026-10-13-kafka-outbox-saga.md` (rev 3). Mindmap: `docs/superpowers/mindmaps/kafka-outbox-saga.wakii`.
> Depends: SF-1 (KAFKA_BROKERS env đã pre-add trong compose, golden fixtures, conventions/09).

## Spec slice (chỉ phần SF-2 chịu trách nhiệm)
1. **Cụm nguyên tử node-side cascade** (1 cụm — sửa cùng lúc để schema-diff.test không đỏ giữa chừng): canonical DDL `contracts/db/tasks-schema.sql` CHECK status thêm `'assignment_failed'` (varchar(20) đủ — 17 ký tự) + `src/db/schema.ts` mirror + migration CHECK + `contracts/openapi/tasks.yaml` **TaskStatus split**: `TaskStatus` 3 giá trị (query param + PATCH body — WRITABLE) / `TaskStatusExtended` 4 giá trị (chỉ `Task.status` response — READ-ONLY). PATCH KHÔNG nhận `assignment_failed` (system-owned); route hard-code 3 giá trị giữ cho query/body, response nới. Typegen drift job sẽ ép commit api.d.ts.
2. **Pin schema-diff.test scope (P0)**: `src/db/schema-diff.test.ts` hiện assert `migrated.tables === canonical.tables` + `canonical.indexes.length === 3` — sửa test WHITELIST outbox table với expected-def riêng (không đếm vào canonical), canonical + index-3 GIỮ NGUYÊN (hướng ngược làm đỏ copy-dir standalone).
3. Outbox table migration (schema `tasks`: id UUID **do node sinh**, type, payload jsonb, created_at, published_at nullable) + drizzle schema. Outbox KHÔNG vào canonical DDL (node-internal infra).
4. **Transactional repo API** (drizzle có `.transaction()` gốc): đổi interface `TaskRepo` (`repo.ts:38-45`) + impl `repo.drizzle.ts` + fake — repo method nhận outbox op, **envelope id sinh trong repo**; event matrix PRESENCE-BASED: POST→`task.created`; PATCH có assigneeId→`task.assigned` (+`task.updated` nếu body còn field khác); PATCH không assigneeId→`task.updated`; DELETE→`task.deleted`; KHÔNG có unassign/null. Fake repo có seam tiêm lỗi giữa 2 step.
5. Relay worker: poll 500ms, publish **đúng golden fixture format** (`contracts/events/fixtures/*.json` — test load chung), mark `published_at`, purge note (published cũ > N ngày).
6. Xóa `clients/activity.ts` + 5 refs (`app.ts:24`, `app.test.ts`, `routes/tasks.ts:30`, `server.ts:5,22`) — thay bằng relay + consumer wiring.
7. Compensation consumer (group `node-svc-compensation`, CHỈ type `task.assignment_failed`): `UPDATE task SET status='assignment_failed' WHERE id AND assignee_id=<payload.assigneeId> AND status NOT IN ('assignment_failed')` — **CONDITIONAL guard chống stale compensation** (bắt buộc — dạy saga đúng).
8. **Task `services-node-svc.yml` kafka boot-smoke (P0)**: `up -d postgres kafka node-svc` + assert outbox row `published_at IS NOT NULL` sau publish (relay THẬT trên CI, không fake).
9. Tests: tx rollback (seam fail giữa 2 step → task VÀ outbox cùng biến mất), relay unit (fake producer), consumer unit. `KAFKA_BROKERS` lazy-connect (env đã có từ SF-1 — KHÔNG sửa compose).
10. README node-svc: standalone ghi dependency contracts/db (FLAG sẵn convergence.yml:62) + outbox/kafka section.

## Touch map (files SF-2 tạo/sở hữu)
```
services/node-svc/**                  [SỞ HỮU — kể cả xóa clients/activity.ts]
contracts/db/tasks-schema.sql         [SỬA — SF-2 sở hữu cụm node-side]
contracts/openapi/tasks.yaml          [SỬA — TaskStatus split]
platform/docker-compose.yml           [READ-ONLY — env đã pre-add SF-1; đụng = FLAG]
contracts/events/fixtures/*.json      [READ-ONLY — test load, KHÔNG sửa]
platform/conventions/09, contracts/events/task-events.md [READ-ONLY]
.github/workflows/services-node-svc.yml [SỞ HỮU — kafka boot-smoke task]
pnpm-lock.yaml                        [kafkajs + commit bình thường; conflict SF-3 = coordinator resolve]
```

## ACCEPTANCE (user-visible)
- Tạo task → outbox row xuất hiện TRONG cùng tx (seam-fail test: task + outbox cùng biến mất khi fail giữa 2 step).
- Relay publish format KHỚP golden fixture (test 2 đầu load chung file).
- CI node workflow xanh gồm boot-smoke kafka: outbox row `published_at IS NOT NULL` trên broker thật.
- PATCH `status: assignment_failed` bị từ chối (schema PATCH 3 giá trị); GET task `assignment_failed` hợp lệ (extended).
- Compensation consumer: event task.assignment_failed → task status đổi; stale event (assignee khác) KHÔNG đổi (conditional guard test).
- 23/23 tests cũ không vỡ (hoặc cập nhật chính đáng theo matrix).

## Boundary (KHÔNG làm)
- KHÔNG sửa compose/.env.example (SF-1 pre-add rồi — đụng = FLAG).
- KHÔNG sửa contracts/events/**, conventions/09, users.json, activity.yaml, go-svc, FE.
- KHÔNG đụng services-go-svc.yml (SF-3).
- KHÔNG value-compare trigger (presence-based là chủ đích — ADR-0008).
- KHÔNG thử docker/kafka local — CI verify (dev machine không Docker).
