# SF-1 Context Pack — Kafka foundation + async contracts
> Đọc file này THAY VÌ tự tổng hợp. Epic spec: `docs/superpowers/specs/2026-10-13-kafka-outbox-saga.md` (rev 3). Mindmap: `docs/superpowers/mindmaps/kafka-outbox-saga.wakii`.
> Story trước FI-62 đã merge (main @0785930) — repo CÓ code thật.

## Spec slice (chỉ phần SF-1 chịu trách nhiệm)
1. `platform/docker-compose.yml` thêm entry `kafka`: image `apache/kafka` (KRaft native, KHÔNG zookeeper), `KAFKA_HEAP_OPTS` ~512MB, healthcheck dùng **full path** `/opt/kafka/bin/kafka-broker-api-versions.sh --bootstrap-server localhost:9092` (image không có script trên PATH), KHÔNG service nào `depends_on` kafka, KHÔNG expose 9092 ra host. Cập nhật **header ownership** compose (SF-1 story này sở hữu).
2. **PRE-ADD env cho downstream (P0 plan-critic — 1 lần sửa compose duy nhất)**: entry `node-svc` thêm `KAFKA_BROKERS: ${KAFKA_BROKERS:-kafka:9092}`; entry `go-svc` thêm `KAFKA_BROKERS` + `AUTH_MOCK_URL: http://auth-mock:8090` + `SVC_ACTIVITY_PASSWORD: ${SVC_ACTIVITY_PASSWORD:?set in .env}`. Đồng bộ `.env.example` (KAFKA_BROKERS, SVC_ACTIVITY_PASSWORD + các kafka env nếu cần). SF-2/3 KHÔNG đụng compose.
3. `contracts/events/task-events.md`: envelope `{schemaVersion:1, id: UUID, type, occurredAt: RFC3339, payload}`; payload shape THEO EVENT TYPE (task.created/updated/assigned/deleted/assignment_failed — liệt kê fields chính xác: taskId, userId, assigneeId?, title?, status?); **filter-by-type convention**: group `go-svc-activity` xử lý mọi type TRỪ `task.assignment_failed`, group `node-svc-compensation` CHỈ nhận `task.assignment_failed`; topics `task-events` (1 partition) + `task-events.dlq`; retry ×3 in-memory rồi DLQ; manual commit sau DB tx; auto.offset.reset earliest.
4. **Golden fixtures `contracts/events/fixtures/*.json`** — mỗi event type 1 file mẫu đúng envelope (P0 plan-critic: SF-2 relay test + SF-3 consumer test + CI console-producer ĐỀU load đây — contract machine-checkable 2 đầu).
5. `platform/conventions/09-async-messaging.md`: quy tắc producer/consumer/retry/DLQ/idempotency (envelope id do producer sinh, consumer ON CONFLICT), lazy-connect rule (Kafka không vào readyz/depends_on).
6. Fixture users: thêm `svc-fail` (email `fail@demo.local`) + `svc-activity` (service user) vào `contracts/auth/users.json` — roles `["user"]` khớp enum users.yaml (spring `SeedMatchIntegrationTest` so seed↔fixture runtime); auth-mock + spring V2 seed đọc tự nhiên (mount runtime, không cần migration mới vì CI volume fresh).
7. `docs/adr/0008-*.md` supersede ADR-0006: vì sao Kafka KRaft, outbox tự viết (không Debezium), simplifications có chủ đích (presence-based trigger, in-memory retry count, PLAINTEXT, segmentio/kafka-go — franz-go là path production), saga choreography.
8. README section compose: 10 services, kafka lazy-connect note.

## Touch map (files SF-1 tạo/sở hữu)
```
platform/docker-compose.yml            [SỬA — SỞ HỮU story này; pre-add env đúng 1 lần]
platform/.env.example                  [SỬA — SỞ HỮU]
contracts/events/task-events.md        [TẠO — SỞ HỮU]
contracts/events/fixtures/*.json       [TẠO — SỞ HỮU, golden cho SF-2/3]
contracts/auth/users.json              [SỬA — thêm 2 fixture users]
platform/conventions/09-async-messaging.md [TẠO — SỞ HỮU]
docs/adr/0008-*.md                     [TẠO — SỞ HỮU]
README.md                              [SỬA section compose]
services/node-svc|go-svc/**, contracts/openapi/*, contracts/db/*   [KHÔNG ĐỤNG — SF-2/3 sở hữu]
```

## ACCEPTANCE (user-visible)
- `docker compose config -q` validate với entry kafka + env mới (CI-verified — dev machine không Docker).
- CI: convergence không đỏ vì kafka entry (không service depend kafka — chain 9 service nguyên vẹn).
- Golden fixtures parse được JSON, envelope đủ field theo task-events.md, mỗi event type 1 file.
- users.json có 2 user mới, roles hợp lệ, spring SeedMatch test (chạy ở SF-4 branch) vẫn pass khi merge.
- ADR-0008 + conventions/09 tồn tại, narrative khớp ADR-0006 (supersede rõ ràng).

## Boundary (KHÔNG làm)
- KHÔNG đụng `contracts/db/tasks-schema.sql`, `contracts/openapi/tasks.yaml`, `activity.yaml`, `services/node-svc/**`, `services/go-svc/**`, FE — SF-2/3 sở hữu.
- KHÔNG đưa kafka vào readyz/depends_on bất kỳ service nào.
- KHÔNG expose 9092 ra host. KHÔNG SASL/SSL.
- Compose chỉ sửa ĐÚNG 1 lần (pre-add env trọn vẹn) — SF-2+ đụng compose = flag.
