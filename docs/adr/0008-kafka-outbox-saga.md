# ADR 0008 — Kafka KRaft + Transactional Outbox + Saga choreography

Ngày: 2026-10-13 · Status: Accepted · **Supersedes [ADR-0006](0006-fire-and-forget-events.md)**

## Context
ADR-0006 chọn fire-and-forget cho event node → go và tự nhận mất-mất (push fail = mất event, không retry). Story FI-76 nâng cấp: delivery guarantee + demo saga compensation. Chọn broker thế nào, relay thế nào, compensation chạy thế nào?

## Decision
1. **Kafka KRaft single-node** (`apache/kafka`, không zookeeper), compose-internal (9092 không expose host), heap 512m cho CI 7GB. Không service nào `depends_on` kafka — connect lazy + retry (không Kafka vào readyz).
2. **Envelope JSON + `schemaVersion: 1`** — không Avro/Schema Registry. Hợp đồng: `contracts/events/task-events.md` + golden fixtures machine-checkable.
3. **Outbox tự viết**: INSERT outbox cùng tx với mutation, relay worker poll ~500ms publish rồi mark `published_at`. Không Debezium/CDC — 1 relay ~50 dòng, không thêm hạ tầng.
4. **Saga choreography**: node bắn `task.assigned` → go consumer fail ×3 (fixture `svc-fail`) → go bắn compensating event `task.assignment_failed` vào topic chung → node compensation consumer (group riêng, filter-by-type) UPDATE conditional `status='assignment_failed'`. Không saga orchestrator.
5. **Simplifications CÓ CHỦ ĐÍCH** (điểm cần thay khi copy production):
   - **Presence-based trigger**: PATCH body có `assigneeId` = bắn event (kể cả same-value) — không value-compare trong tx; production: value-compare.
   - **In-memory retry count ×3** — không retry topic/state ngoài; production: retry topic + backoff lâu.
   - **PLAINTEXT**, 1 partition, auto-create topic (broker-side mặc định — CI convergence tạo sẵn `task-events` + `task-events.dlq` tường minh chỉ để chống auto-create race lúc boot, không phải quản trị topic), segmentio/kafka-go cho go-svc — production: SASL/SSL, partition theo load, tạo topic tường minh, franz-go.
   - Envelope `id` do producer sinh trong tx — là khóa idempotency duy nhất của consumer.

## Consequences
- (+) Mutation KHÔNG bao giờ mất event nữa (outbox atomic với tx) — khắc phục đúng điểm yếu ADR-0006.
- (+) Saga compensation demo được end-to-end không thêm service/orchestrator.
- (−) Consumer bắt buộc idempotent (at-least-once) — vi phạm = duplicate feed; ràng buộc ở conventions/09 rule 4.
- (−) Single-node KRaft không HA, PLAINTEXT chỉ an toàn trong mạng compose — sample, không production.
- (−) Giữa lúc node publish mà go consumer chưa merge (checkpoint 1 của FI-76), convergence đỏ cấu trúc là động đã biết — không tính verify-fail.
