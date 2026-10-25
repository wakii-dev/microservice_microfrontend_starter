# SF-2 Plan — node-svc Outbox + Producer + compensation consumer (FI-79)

> Story FI-76 · Epic spec rev 3: `docs/superpowers/specs/2026-10-13-kafka-outbox-saga.md`
> Context pack: `docs/superpowers/contexts/sf-2.md` · conventions/09 · ADR-0008
> Branch: `__STACK_ORG__/sf-2-node-outbox` (fork từ dest @8d04e6d) · 1 commit / task · KHÔNG merge dest
> Baseline probe (đã đọc): `repo.ts:38-45` interface CRUD thuần · `repo.drizzle.ts` không `.transaction()` ·
> `schema-diff.test.ts:146` normalizer throw ở DDL chưa handle (chỉ CREATE SCHEMA/TABLE/INDEX — ALTER
> CONSTRAINT phải mở rộng normalizer, phát hiện mới ngoài context pack).

## Tasks

^- [x] **T1 — Cụm nguyên tử status cascade (DDL + drizzle mirror + migration CHECK)**: `contracts/db/tasks-schema.sql` CHECK `status IN ('todo','in_progress','done','assignment_failed')` (varchar(20) đủ — 17 ký tự) + comment; `src/db/schema.ts` mirror; migration `0001` qua `drizzle-kit generate` (DROP/ADD CONSTRAINT `status_check`). Migration KHÔNG đụng phần khác.
  Exit: `schema-diff.test` chạy được (T3 sẽ mở rộng normalizer); DDL comment ghi assignment_failed là system-owned.
^- [x] **T2 — tasks.yaml TaskStatus split + typegen**: `TaskStatus` giữ 3 giá trị (query param + PATCH body — WRITABLE, description ghi rõ); thêm `TaskStatusExtended` 4 giá trị (chỉ `Task.status` response — READ-ONLY); PATCH KHÔNG nhận `assignment_failed`. Chạy `pnpm --filter node-svc generate:types` → commit `api.d.ts`.
  Exit: typegen diff-check CI pass (route hard-code 3 giá trị giữ nguyên — đã đúng từ trước).
^- [x] **T3 — Pin schema-diff.test scope (P0)**: mở rộng normalizer handle `ALTER TABLE ... DROP CONSTRAINT` / `ADD CONSTRAINT` (không throw); WHITELIST bảng outbox với expected-def RIÊNG (so khớp def, KHÔNG đếm vào canonical); assert `tasks.outbox` tồn tại trong migrated; canonical + `indexes.length === 3` GIỮ NGUYÊN (hướng ngược làm đỏ copy-dir standalone).
  Exit: test xanh với migration 0001; đỏ nếu outbox lệch def.
^- [x] **T4 — Outbox table migration + drizzle schema**: `tasks.outbox` (id UUID do node sinh PK, type varchar(40), payload jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), published_at timestamptz NULL) — KHÔNG index (đúng spec, purge lo scan); `schema.ts` thêm bảng; migration `0002` generate. Outbox KHÔNG vào canonical DDL (node-internal infra).
  Exit: schema-diff whitelist T3 thấy đúng def; migration áp được bằng custom runner.
^- [x] **T5 — Transactional TaskRepo API + tx rollback test (seam)**: đổi interface `repo.ts` — mutation method nhận outbox op (`create(input, events)`, `update(id, patch, events)`, `remove(id, events)`, thêm `markAssignmentFailed(taskId, assigneeId): Promise<boolean>` conditional guard); **envelope id (UUIDv4) + occurredAt sinh TRONG repo**; drizzle impl bọc mutation + INSERT outbox trong 1 `.transaction()`; fake repo có seam tiêm lỗi giữa 2 step (mô phỏng rollback: cả 2 cùng biến mất). Test tx rollback: mock-db `transaction()` ghi nhận 2 op, outbox insert throw → task + outbox cùng biến mất (không còn row nào).
  Exit: `repo.drizzle.test.ts` (mới) xanh: happy path 2 op trong cùng tx callback + seam-fail rollback.
^- [x] **T6 — Route event matrix (presence-based) + xóa clients/activity.ts**: build events từ body tại `routes/tasks.ts` (POST→`task.created`; PATCH có `assigneeId`→`task.assigned` + `task.updated` nếu body còn title/status; PATCH không→`task.updated`; DELETE→`task.deleted`; KHÔNG có unassign; payload `task.updated` chỉ title/status/assigneeId — KHÔNG description); xóa `clients/activity.ts` + 5 refs (`app.ts:24`, `app.test.ts`, `routes/tasks.ts:30`, `server.ts:5,22`); `server.ts` wire relay + consumer thay activity client.
  Exit: tsc build sạch; không còn ref activity client.
^- [x] **T7 — app.test.ts cập nhật theo matrix (23/23 cũ không vỡ hoặc cập nhật chính đáng)**: test POST/PATCH/DELETE assert events ghi trong fake repo đúng type + payload shape (so golden fixture `contracts/events/fixtures/*.json` — load chung file); PATCH `status: assignment_failed` → 400 VALIDATION_ERROR; GET task `assignment_failed` hợp lệ (fake trả extended); bỏ test fire-and-forget go-svc (thay bằng outbox-in-tx assert).
  Exit: toàn bộ node-svc unit test xanh.
^- [x] **T8 — Relay worker + KAFKA_BROKERS lazy + relay unit test (golden fixture)**: `env.ts` thêm `kafkaBrokers` (optional — thiếu = warn + không start relay/consumer, KHÔNG crash, KHÔNG vào readyz); `outbox-relay.ts` poll 500ms: SELECT unpublished → kafkajs producer send topic `task-events` **key = payload.taskId**, envelope `{schemaVersion:1, id, type, occurredAt, payload}` → mark `published_at` (publish TRƯỚC mark — crash giữa chừng = duplicate, consumer dedupe); purge published cũ > 7 ngày; lazy-connect retry backoff, fail = warn không crash. Unit test: fake producer + fake repo, assert message khớp golden fixture format (2 đầu load chung file).
  Exit: relay test xanh không cần broker.
^- [x] **T9 — Compensation consumer + unit test (conditional guard)**: `compensation-consumer.ts` group `node-svc-compensation`, CHỈ xử lý `type === 'task.assignment_failed'` (type khác = commit + skip); xử lý = `markAssignmentFailed` (conditional UPDATE `WHERE assignee_id = payload.assigneeId AND status <> 'assignment_failed'` — stale event KHÔNG đổi); manual offset commit SAU khi DB op xong (kafkajs `autoCommit: false` + `commitOffsets`); retry ×3 in-memory backoff → hết lượt publish message gốc + metadata vào `task-events.dlq` rồi commit (KHÔNG block partition). Unit test: happy (status đổi), stale (assignee khác → không đổi, vẫn commit), filter (type khác skip), idempotent (event lặp → lần 2 match 0 row).
  Exit: consumer unit test xanh không cần broker/postgres.
^- [x] **T10 — CI kafka boot-smoke (P0)**: `services-node-svc.yml` thêm job `kafka-boot-smoke`: `up -d postgres kafka node-svc` (env-file .env.example) → readyz 200 → POST task (JWT tự ký) → poll `tasks.outbox` `published_at IS NOT NULL` (psql trong container postgres, timeout) → assert `type='task.created'` + payload có taskId. Relay THẬT trên CI (không fake). Lưu ý YAML block-scalar (improvements-log SF-7): không heredoc/JSON cột 0 trong `run: |`.
  Exit: job mới có trong workflow; logic poll đúng cú pháp (CI chạy thật ở bước 3 checklist).
^- [x] **T11 — README node-svc + evidence + audit**: README thêm outbox/kafka section (relay, compensation consumer, event matrix, KAFKA_BROKERS lazy) + mục standalone ghi dependency `contracts/db/tasks-schema.sql` + `contracts/events/fixtures` (FLAG sẵn convergence.yml:62); evidence `docs/superpowers/evidence/sf-2-node-outbox/test-run.txt` (HEAD + test output); Linear audit comment FI-79.
  Exit: README đầy đủ; evidence đúng convention B1.

## Nhóm review (rolling — code-reviewer độc lập)
- Nhóm A sau T5: schema cascade + outbox + repo tx (T1-T5).
- Nhóm B sau T9: routes/relay/consumer/tests (T6-T9).
- Final: T10-T11 + verdict materialize `/tmp/story/fi62/code-reviewer-sf-2-node-outbox.md` + Linear comment (VERDICT + CHECKLIST-4Q) cho gate B3.

## ACCEPTANCE (từ context pack — verify từng dòng trước DONE)
1. Tạo task → outbox row trong cùng tx (seam-fail test: task + outbox cùng biến mất).
2. Relay publish format KHỚP golden fixture (test 2 đầu load chung file).
3. CI node workflow xanh gồm boot-smoke kafka: outbox row `published_at IS NOT NULL` trên broker thật.
4. PATCH `status: assignment_failed` bị từ chối; GET task `assignment_failed` hợp lệ.
5. Consumer: event assignment_failed → status đổi; stale event (assignee khác) KHÔNG đổi.
6. 23/23 tests cũ không vỡ (hoặc cập nhật chính đáng theo matrix).
