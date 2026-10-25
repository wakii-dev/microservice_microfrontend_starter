# Task events — hợp đồng async (Kafka) giữa node-svc ↔ go-svc

Nguồn sự duy nhất về envelope + payload + consumer convention cho topic `task-events`.
Mọi producer/consumer (node-svc outbox relay SF-2, go-svc consumer SF-3) PHẢI theo
file này. Golden fixtures machine-checkable: [`fixtures/`](fixtures/) — relay test +
consumer test + CI console-producer ĐỀU load chung các file này. Quy tắc vận hành:
[platform/conventions/09-async-messaging.md](../../platform/conventions/09-async-messaging.md).
Quyết định kiến trúc: [docs/adr/0008-kafka-outbox-saga.md](../../docs/adr/0008-kafka-outbox-saga.md).

## Envelope (bắt buộc, mọi event)

```json
{
  "schemaVersion": 1,
  "id": "UUIDv4 — producer sinh, KHÓA IDEMPOTENCY của consumer",
  "type": "task.created | task.updated | task.assigned | task.deleted | task.assignment_failed",
  "occurredAt": "RFC3339 UTC (vd 2026-10-13T09:00:00Z)",
  "payload": { "...": "shape theo type — bảng dưới" }
}
```

| Field | Kiểu | Quy tắc |
|---|---|---|
| `schemaVersion` | integer | Cố định `1`. Thêm field payload không breaking (consumer bỏ qua field lạ); đổi shape breaking = tăng version |
| `id` | UUIDv4 | Producer sinh MỖI event (trong cùng DB tx với mutation — outbox). Consumer dùng làm khóa idempotency — KHÔNG dùng taskId |
| `type` | string enum | 5 giá trị ở trên. KHÔNG bịa type mới ngoài enum |
| `occurredAt` | RFC3339 UTC | Thời điểm mutation (không phải lúc publish) |
| `payload` | object | Theo type — bảng dưới. Không chứa secret |

## Payload shape theo event type

| Type | Payload fields (camelCase) | Sinh bởi |
|---|---|---|
| `task.created` | `taskId` uuid · `userId` uuid (owner) · `title` string · `status` string (`todo\|in_progress\|done`) · `assigneeId` uuid **?** | node-svc (POST) |
| `task.updated` | `taskId` uuid · `userId` uuid · chỉ các field ĐỔI trong: `title?` · `status?` · `assigneeId?` | node-svc (PATCH không có assigneeId) |
| `task.assigned` | `taskId` uuid · `userId` uuid (người assign) · `assigneeId` uuid | node-svc (PATCH có `assigneeId` trong body — **presence-based**: same-value re-PATCH vẫn bắn event mới, id mới) |
| `task.deleted` | `taskId` uuid · `userId` uuid | node-svc (DELETE) |
| `task.assignment_failed` | `taskId` uuid · `assigneeId` uuid · `reason` string | go-svc consumer (retry ×3 hết — compensating event) |

Quy ước `status` trong payload: chỉ giá trị writable 3 giá trị. `task.assignment_failed`
là TRẠNG THÁI hệ thống — KHÔNG bao giờ xuất hiện trong `payload.status` của event,
chỉ tồn tại ở `tasks.status` (DB) qua compensation.

## Topics

| Topic | Partition | Dùng |
|---|---|---|
| `task-events` | 1 | Mọi event ở bảng trên. Message **key = `payload.taskId`** — thứ tự per-task guaranteed trong partition |
| `task-events.dlq` | 1 | Message GỐC + metadata lỗi, sau retry ×3 hết. KHÔNG requeue tự động |

Demo dùng auto-create topic (config mặc định image). Copy production: tạo topic
tường minh (`kafka-topics.sh --create`), partition theo load, KHÔNG dựa auto-create.

## Consumer groups — filter-by-type convention

Hai group cùng đọc `task-events`, tự lọc theo `type`:

| Group | Nhận | Bỏ qua |
|---|---|---|
| `go-svc-activity` (go-svc consumer) | MỌI type **TRỪ** `task.assignment_failed` | `task.assignment_failed` |
| `node-svc-compensation` (node-svc consumer) | **CHỈ** `task.assignment_failed` | 4 type còn lại |

Thêm group mới = thêm dòng ở đây cùng commit.

## Delivery semantics

- **At-least-once** → consumer PHẢI idempotent: dedupe bằng envelope `id`
  (vd Postgres `INSERT ... ON CONFLICT (id) DO NOTHING`).
- **Manual offset commit SAU khi DB tx commit thành công** — commit trước tx =
  crash giữa chừng mất event; commit sau tx = at-least-once (dedupe lo phần còn lại).
- **Retry ×3 in-memory** (backoff) cho lỗi xử lý → hết lượt: ghi message gốc vào
  `task-events.dlq` + metadata lỗi, KHÔNG block partition. Riêng `task.assignment_failed`
  là compensating event — được PUBLISH lại vào `task-events` (không vào DLQ).
- `auto.offset.reset: earliest` — consumer mới đọc lại từ đầu (fixture demo, idempotency lo duplicates).

## Không làm

- Không đưa secret/token vào payload (envelope đi qua broker PLAINTEXT — compose-internal).
- Không đổi envelope/topic/group khi chưa sửa file này + golden fixtures CÙNG commit.
- Không thêm Avro/Schema Registry — JSON thuần với `schemaVersion` (ADR-0008).
