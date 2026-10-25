# 09 — Async messaging qua Kafka (outbox + consumer + DLQ)

Hợp đồng envelope/payload/topics là nguồn sự thật riêng:
[`contracts/events/task-events.md`](../../contracts/events/task-events.md) — file này
chỉ quy tắc VẬN HÀNH. Quyết định kiến trúc: [ADR-0008](../../docs/adr/0008-kafka-outbox-saga.md).

## Quy tắc

1. **Lazy-connect**: Kafka KHÔNG vào `/readyz` và KHÔNG có service nào
   `depends_on: kafka` — health-gated chain 9 service không bị kafka chặn. Service
   boot được cả khi broker chưa lên: producer/consumer connect retry backoff lúc
   boot, connect fail = log warn, KHÔNG crash, KHÔNG fallback im lặng sang chế độ
   bỏ-event.
2. **Producer qua transactional outbox**: mutation DB và INSERT outbox (envelope
   `id` = UUIDv4 sinh trong repo) trong CÙNG 1 tx. Relay worker poll (~500ms)
   publish rồi mark `published_at`. KHÔNG publish broker trực tiếp trong request
   path — publish fail giữa chừng = mất event (đúng điều ADR-0006 đã loại).
3. **Envelope bắt buộc**: mọi message JSON đúng envelope `{schemaVersion, id, type,
   occurredAt, payload}` (task-events.md). `schemaVersion` integer cố định `1`;
   payload chỉ thêm field không breaking — consumer BỎ QUA field lạ, không chết.
4. **Consumer idempotent**: at-least-once là mặc định — dedupe bằng envelope `id`
   (`ON CONFLICT DO NOTHING`), KHÔNG dùng taskId (re-assign = nhiều event hợp lệ
   cùng taskId).
5. **Manual commit sau DB tx**: offset commit CHỈ sau khi DB tx commit thành công.
   Commit trước tx = crash mất event; at-least-once + idempotency lo phần còn lại.
6. **Filter-by-type theo group**: mọi consumer khai group của mình ở
   task-events.md và lọc theo `type` — group mới phải thêm vào bảng group trước.
7. **Retry ×3 in-memory rồi DLQ**: lỗi xử lý retry backoff ×3 in-memory; hết lượt
   → message gốc + metadata lỗi vào `task-events.dlq`, KHÔNG requeue vô hạn,
   KHÔNG block partition. Copy production: thêm alert + replay tool cho DLQ.
8. **Kafka compose-internal**: PLAINTEXT, 9092 không expose host, single-node
   KRaft heap 512m. Copy production: SASL/SSL + multi-broker (viền thay đổi nằm
   ở entry kafka compose + client config).
9. **Không secret trong payload** — envelope đi qua broker PLAINTEXT; payload là
   dữ liệu demo (users fixture, task title).

## Env liên quan (chi tiết trong `.env.example`)

| Biến | Dùng bởi |
|------|----------|
| `KAFKA_BROKERS` | node-svc (relay + compensation consumer), go-svc (consumer) |
| `SVC_ACTIVITY_PASSWORD` | go-svc — login fixture user `svc-activity` lấy service token (khớp `AUTH_MOCK_DEV_PASSWORD`) |
