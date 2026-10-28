# Epic Spec — Kafka + Transactional Outbox + Saga (mở rộng FI-62)

> Story: pending epic ID · tạo 2026-10-13 · pipeline: story-workflow CREATE
> Repo: `wakii-dev/architecture-overview` (main @0785930 — boilerplate FI-62 đã merge)
> Phase 0: analyst xong (3 P0 đã hấp thụ: CHECK constraint 2 đầu, resolver bearer, CI go-svc hard-code ingest)
> Rev 2 — sau spec-critic (FIX-P0-FIRST): varchar(40) cho action; PATCH event matrix chốt; TaskStatus tách writable/extended; ownership activity.yaml→SF-3, DDL-node-cụm→SF-2 nguyên tử; go workflow 3 touch points pin phương án; resolver login backoff + lazy re-login; compensation UPDATE conditional
> Rev 3 — sau plan-critic (FIX-P0-FIRST, 5 P0): SF-1 pre-add env consumers (compose+.env.example); SF-2 thêm task services-node-svc.yml kafka boot-smoke + pin schema-diff.test whitelist outbox; SF-1 golden envelope fixtures (2 đầu test load chung); FE remote-tasks badge → SF-3; SF-4 cắt false dep (tier 0 song song SF-1); checkpoint-1 convergence đỏ tạm ghi rõ; e2e assert DLQ; activity.yaml ×2 file + diff-guard

## IDEA-BRIEF (8 chiều)

- **Task**: Nâng luồng event của boilerplate từ REST fire-and-forget (ADR-0006 tự nhận mất-mất) lên **Kafka + Transactional Outbox + Saga choreography**; thêm demo @Transactional nhiều step cho spring-svc.
- **Output**: Boilerplate vẫn `compose up` được (10 services), có topic `task-events` + DLQ, outbox pattern, saga compensation demo, ADR-0008; CI toàn green.
- **Users**: Team copy boilerplate — học được: transactional outbox, at-least-once + idempotency, consumer retry/DLQ, saga compensation, @Transactional.
- **Constraints**: Kafka single-node **KRaft** (`apache/kafka`, KHÔNG expose 9092 ra host); JSON envelope + `schemaVersion` (không Avro/Registry); outbox relay **tự viết** poll 500ms; saga **choreography**; CI-only verify (user máy yếu); không service nào `depends_on: kafka: service_healthy` (chain 9 service nguyên vẹn, connect lazy).
- **Input**: Code main @0785930 (đã probe: node push tại `routes/tasks.ts:222-234` ×3 điểm, go ingest `internal/api/events.go`, spring chưa có service layer, compose 9 services health-gated).
- **Context**: RAM CI 7GB — Kafka heap ~512MB; user không chạy local.
- **Success criteria**: (1) compose up 10 services xanh; (2) tạo task → event qua outbox → Kafka → go consume → feed hiện (at-least-once + idempotent — duplicate event không nhân đôi feed); (3) saga fail path: assign cho fixture fail-user → go fail ×3 → DLQ → compensating → task status `assignment_failed` thấy trên FE; (4) spring @Transactional rollback demo test xanh; (5) CI all green gồm convergence sửa đổi.
- **Out-of-scope**: Schema Registry/Avro; Debezium; Kafka UI; SASL/SSL (PLAINTEXT compose-internal); multi-broker; Exactly-once semantics.

## Quyết định đã chốt (user, 2026-10-12/13)

| # | Quyết định | Chọn |
|---|---|---|
| U1 | Model kết quả compensation | Giá trị mới `assignment_failed` của `tasks.status` (cascade có kiểm soát ~6 file) |
| U2 | Saga entry point | Reuse PATCH `assigneeId` hiện có (không thêm endpoint) |
| U3 | REST ingest `/api/activity/events` | **Xóa sạch** (việc sửa CI go-svc hard-code thuộc SF-3) |
| U4 | Kafka image + port | `apache/kafka` KRaft, compose-internal only (không expose 9092) |

Tự quyết theo conventions (ADR-0008 ghi): `schemaVersion: 1` integer; topics `task-events` + `task-events.dlq`; 1 partition; consumer groups `go-svc-activity` + `node-svc-compensation`; `auto.offset.reset: earliest`; **manual commit sau DB tx**; retry in-memory ×3 rồi DLQ; envelope JSON `{schemaVersion, id, type, occurredAt, payload}` — `id` sinh ở NODE (UUID) để go dedupe `ON CONFLICT DO NOTHING` (at-least-once + idempotent); thư viện go = `segmentio/kafka-go` (ADR ghi franz-go là path production); outbox table trong schema `tasks` (cột `published_at`, purge note); ADR-0008 supersede ADR-0006.

## Thiết kế chính

### Saga flow "assign task" (choreography) — event matrix CHỐT (rev 2)

**Event matrix (mỗi mutation → event, envelope id do node sinh MỖI event):**
| Mutation | Event(s) trong cùng 1 outbox tx |
|---|---|
| POST create | `task.created` |
| PATCH có `assigneeId` trong body | `task.assigned` (+ `task.updated` nếu body còn có field khác đổi) |
| PATCH không có assigneeId | `task.updated` |
| DELETE | `task.deleted` |
| Unassign (assigneeId=null) | **KHÔNG trong scope** — schema hiện nhận string, không null; ghi rõ để executor không bịa `task.unassigned` |
**Trigger predicate: PRESENCE-BASED** (body có assigneeId = bắn event, kể cả same-value). Same-value re-PATCH → event mới id mới → feed 2 dòng — chấp nhận, ADR-0008 ghi "value-compare là path production". Không cần đọc row cũ trong tx (repo đổi nhẹ hơn).

**Pipeline:**
```
PATCH /api/tasks/{id} (body có assigneeId) — node-svc:
  [1 tx: UPDATE task + INSERT outbox(task.assigned + task.updated?)]  ← Situation A demo
relay (500ms poll) → publish task-events
go-svc consumer (group go-svc-activity, filter-by-type: bỏ qua task.assignment_failed):
  [1 tx: INSERT activity (ON CONFLICT DO NOTHING bằng envelope id) + simulate notify]
  notify fail? → retry ×3 (in-memory) → publish task.assignment_failed (vào task-events) → DLQ original
node-svc consumer (group node-svc-compensation, CHỈ nhận task.assignment_failed):
  [tx: UPDATE task SET status='assignment_failed' WHERE id=? AND assignee_id=<event.assigneeId>
   AND status NOT IN ('assignment_failed')]  ← CONDITIONAL guard: chống stale compensation
```
Re-assign sau `assignment_failed`: PATCH assigneeId hợp lệ (writable path) → saga chạy lại từ đầu.

**TaskStatus tách (U1a cascade đúng):** `contracts/openapi/tasks.yaml` tách `TaskStatus` (3 giá trị — query param + PATCH body, WRITABLE) / `TaskStatusExtended` (4 giá trị + `assignment_failed` — chỉ `Task.status` response, READ-ONLY). PATCH **KHÔNG nhận** `assignment_failed` (system-owned); route hard-code 3 giá trị giữ cho query/body, chỉ response nới.

**Simulate fail hook (deterministic cho e2e):** assign cho fixture user `svc-fail` (email `fail@demo.local`, trong users.json) → go consumer cố tình fail. Fixture users thêm 2 dòng: `svc-fail` + `svc-activity` (service user —cascade users.json một file, spring seed + auth-mock đọc tự nhiên).

### Resolver bearer (P0 analyst): go consumer không có HTTP request
go-svc **login bằng fixture service user `svc-activity` (password env) — retry backoff lúc boot, KHÔNG crash nếu auth-mock chưa lên (go chỉ depends_on postgres); lazy re-login khi resolver gặp 401/expiry** → cache JWT → resolver dùng token này enrich userName. Dạy pattern service-identity. auth-mock cấp token cho mọi fixture user — không sửa auth-mock ngoài fixture (SF-1).

### Status cascade `assignment_failed` (U1a — ownership NGUYÊN TỬ, rev 2)
- **SF-2 sở hữu NGUYÊN CỤM node-side**: canonical DDL `contracts/db/tasks-schema.sql` CHECK + `schema.ts` mirror + migration CHECK + `contracts/openapi/tasks.yaml` (TaskStatus split writable/extended) — sửa một cụm để schema-diff.test không đỏ giữa chừng. SF-1 KHÔNG đụng DDL/tasks.yaml.
- **SF-3 sở hữu NGUYÊN CỤM activity-side**: `internal/store/migrations/0002` — **`ALTER COLUMN action TYPE varchar(40)`** (`task.assignment_failed` = 22 ký tự > varchar(20) hiện tại — chỉ sửa CHECK mà quên width = InsertEvent chết runtime) + CHECK drop/recreate thêm `task.assigned`/`task.assignment_failed` + `contracts/openapi/activity.yaml` TRỌN GÓI (xóa `/events` path + `ActivityEventInput` + `EventAccepted`, sửa enum action, description, stats keys) + `store/tasks.go` status map + FE remotes tests/tile verify.
- SF-5 verify FE tổng thể.

### P0 bắt buộc (mỗi mục 1 task tường minh, không drive-by)
1. **CHECK + column width 2 đầu**: SF-2 (tasks.status CHECK + TaskStatus split) / SF-3 (activity.action **varchar(40)** + CHECK mới).
2. **Resolver service-token** với login backoff + lazy re-login (trên).
3. **`services-go-svc.yml` 3 điểm chạm** (rev 2 — enumerate đủ): (a) step event→feed→stats roundtrip POST /events → **thay bằng kafka console producer publish test event** (image apache/kafka có sẵn script) + kafka vào subset boot; (b) stats assert exact-equality 3 keys → nới cho key thứ 4; (c) chấp nhận chỉ khi boot-smoke còn ≥1 proof event→feed (chống thoái hóa). SF-3 sở hữu.
4. **Compose ownership header**: SF-1 cập nhật header (sở hữu story này).
5. **Kafka KHÔNG vào readyz/depends_on** — connect lazy + retry; `KAFKA_HEAP_OPTS` ~512MB.

## SF split (5 SF — anti-duplicate checked: không pattern lặp ≥50%; SF-4 mỏng nhất 8 tasks vẫn giữ riêng vì stack/độc lập Kafka)

### Tier 0 — SF-1 · Kafka foundation + async contracts (~12 tasks)
Kafka entry compose (apache/kafka KRaft, heap 512m, healthcheck `/opt/kafka/bin/kafka-broker-api-versions.sh` full-path, KHÔNG depend_on, KHÔNG expose 9092) + `.env.example` env mới + header ownership; **PRE-ADD env cho downstream consumers (P0 plan-critic): KAFKA_BROKERS vào node-svc + go-svc entries; AUTH_MOCK_URL + SVC_ACTIVITY_PASSWORD vào go-svc — 1 lần sửa compose duy nhất để SF-2/3 không đụng compose**; `contracts/events/task-events.md` (envelope `{schemaVersion,id,type,occurredAt,payload}`, payload shape theo event type — CẦN TRƯỚC consumer go; filter-by-type convention 2 group cùng đọc task-events; topic/DLQ naming); **golden fixtures `contracts/events/fixtures/*.json`** — mỗi event type 1 file, SF-2 relay test + SF-3 consumer test + CI console-producer ĐỀU load chung (contract machine-checkable 2 đầu); `platform/conventions/09-async-messaging.md`; fixture `svc-fail` + `svc-activity` users (users.json — roles ["user"] khớp enum; spring V2 seed + auth-mock đọc tự nhiên); ADR-0008 supersede 0006 (ghi simplifications: presence-based trigger, in-memory retry count, plaintext); README compose section. KHÔNG đụng DDL/tasks.yaml/activity.yaml.

### Tier 1 — SF-2 · node-svc Outbox + Producer + compensation consumer (~12 tasks)
**Cụm nguyên tử node-side cascade**: canonical DDL CHECK `assignment_failed` + `schema.ts` mirror + migration + `tasks.yaml` TaskStatus split (writable 3 / extended 4 — PATCH cấm assignment_failed, route hard-code 3 giữ). **Pin schema-diff.test scope (P0 plan-critic): whitelist outbox với expected-def riêng, KHÔNG thêm vào canonical DDL, index-3 assert giữ nguyên** — hướng NGƯỢC làm đỏ copy-dir. Outbox table migration (schema tasks: id UUID do node sinh, type, payload jsonb, created_at, published_at nullable) + drizzle schema; **transactional repo API** (drizzle `.transaction()` gốc — đổi interface `TaskRepo` + fake; fake có seam tiêm lỗi cho test rollback; envelope id sinh trong repo); event matrix presence-based; relay worker poll 500ms (kafkajs) publish fixture-format + mark published_at (purge note); xóa `clients/activity.ts` + 5 refs; compensation consumer (group node-svc-compensation, conditional UPDATE guard) → `assignment_failed`; **task `services-node-svc.yml` kafka boot-smoke (P0 plan-critic): `up -d postgres kafka node-svc` + assert outbox row `published_at IS NOT NULL` (relay thật, không fake)**; tests: tx rollback (seam fail giữa 2 step), relay unit (fake producer load golden fixture), consumer unit; `KAFKA_BROKERS` lazy (env đã có từ SF-1); docs: README node-svc standalone ghi dependency contracts/db (FLAG sẵn có convergence.yml:62).

### Tier 1 — SF-3 · go-svc Consumer + Saga + thanh lý ingest (~12 tasks)
**Cụm nguyên tử activity-side cascade**: migration `0002` — `ALTER COLUMN action TYPE varchar(40)` + CHECK drop/recreate (`task.assigned`, `task.assignment_failed`) + **activity.yaml ×2 FILE** (canonical `contracts/openapi/activity.yaml` + snapshot nhúng `services/go-svc/internal/api/openapi/activity.yaml` — sửa 1 bỏ 1 = docs endpoint lệch im lặng; thêm diff-guard vào go workflow theo precedent spring) TRỌN GÓI (xóa /events path + ActivityEventInput + EventAccepted; enum action; description; stats keys) + `store/tasks.go` map + **FE remote-tasks badge `assignment_failed` (P0 plan-critic: type + statusLabel map + tests — gán đích danh SF-3)** + remote-activity action labels. Consumer package (segmentio/kafka-go, group go-svc-activity, manual commit sau tx, ON CONFLICT DO NOTHING bằng envelope id, filter-by-type, test load golden fixture); retry ×3 → publish `task.assignment_failed` vào task-events → DLQ original; resolver service-token (login svc-activity backoff + lazy re-login 401); xóa `api/events.go` ingest + wiring + tests cập nhật; **`services-go-svc.yml` 3 điểm chạm + diff-guard** (console producer publish golden fixture + kafka vào subset + tạo topic tường minh + stats assert nới — giữ ≥1 proof event→feed); simulate fail hook svc-fail; tests: consumer unit, idempotency (duplicate event 1 feed row).

### Tier 0 — SF-4 · spring-svc @Transactional demo (~8 tasks)
**KHÔNG depends-on SF-1 (false dep cắt — plan-critic): trigger rollback dùng alice@demo.local có sẵn**, không đụng kafka/compose/file nào SF-1 sửa → chạy song song SF-1 từ tier 0. `service/TeamService` (mới — service layer); endpoint tạo team + members qua N step, fail giữa chừng (member trùng email alice@demo.local) → **rollback toàn bộ**; controller delegate sang service; tests: happy + rollback assert (team không tồn tại sau fail) trên postgres service container; README. KHÔNG dính Kafka.

### Tier 2 — SF-5 · Convergence + ADR sync + docs (~10 tasks)
`convergence.yml`: boot 10 services, kafka heap, poll budget nới (outbox 500ms + Kafka latency), copy-dir giữ contracts/db (outbox KHÔNG vào canonical DDL — node-internal infra); `scripts/smoke/e2e.sh`: happy path (tạo task → feed) + saga path (assign svc-fail → poll status assignment_failed **+ assert DLQ: kafka-console-consumer đọc task-events.dlq thấy event gốc** — acceptance #3 đủ 2 nửa); FE remotes verify tổng thể trên stack thật; walkthrough + README sync (+ note Flyway V2 seed 1 lần — pgdata volume CŨ thiếu svc users → hướng dẫn `down -v` sau pull); ADR-0008 consistency rà; security pass cuối (9092 không expose, secrets không vào envelope); scaffold probe (kafka entry tự flow).

## Phased-release
- Phase 1 COMPLETE = SF-1..4 merged + **services workflows** xanh (node/go có Kafka trong boot-smoke riêng) → CHECKPOINT 1. **Ghi rõ (plan-critic): convergence.yml chạy trên mọi push — giữa lúc SF-2 merged mà SF-3 chưa, convergence đỏ cấu trúc (node publish, chưa có consumer) là ĐỘNG đã biết, KHÔNG tính verify-fail; merge SF-2/SF-3 cận nhau; tiêu chí checkpoint 1 = services workflows xanh.**
- Phase 2 COMPLETE = SF-5 merged + convergence xanh 10 services + saga e2e 2 chiều (kèm DLQ assert) → STORY-COMPLETE candidates.

## Acceptance (epic-level, user-visible)
1. `compose up` 10 services xanh (Kafka không chặn chain — connect lazy).
2. Tạo task → activity feed hiện **qua Kafka** (outbox → topic → consumer), duplicate event không nhân đôi feed (bằng chứng: go consumer unit test idempotency — ON CONFLICT DO NOTHING bằng envelope id).
3. Assign task cho `svc-fail` → sau retry ×3 → task status `assignment_failed` (FE/PATCH GET thấy), event gốc nằm ở `task-events.dlq`.
4. Assign cho user thường → feed hiện bình thường (happy saga).
5. spring: tạo team fail giữa chừng → DB không có team lẫn members (rollback test).
6. REST `/api/activity/events` đã xóa (404), CI go-svc xanh với workflow sửa đổi.
7. CI all green trên dest gồm convergence sửa đổi; ADR-0008 + conventions/09 tồn tại.

## Boundary epic-level
- Nhánh đích `story-<epic-id>-kafka-outbox-saga`; PR human merge.
- CI-only verify (user máy yếu); Kafka không expose host; không đụng product code ngoài files trong touch map (bug thấy = report).
- Historical docs (plans/specs/contexts FI-62 nhắc /api/activity/events) KHÔNG sửa.
