# ADR 0006 — Event push fire-and-forget (node-svc → go-svc)

Ngày: 2026-10-12 · Status: Accepted

## Context
Sau khi mutate task, node-svc đẩy event activity sang go-svc. Chọn delivery semantics: sync chờ (chặn mutation), outbox/retry, hay fire-and-forget?

## Decision
**Fire-and-forget**: push bất đồng bộ SAU khi mutation commit; go-svc trả 202 và persist async; push fail → JSON log warn, KHÔNG chặn mutation task, KHÔNG retry, không message broker (Kafka… out-of-scope epic).

## Consequences
- (+) Mutation task không bao giờ fail vì activity down — boundary nghiêm giữa write path và read path.
- (−) Feed có thể thiếu event tạm thời (không guarantee delivery) — chấp nhận cho sample; e2e smoke poll thay vì assert ngay (scripts/smoke/e2e.sh, 10×1s).
- (−) Điểm cắm khi copy dự án thật: thay push-REST bằng outbox table + relay, hoặc broker — viền thay đổi nằm ở `services/node-svc/src/clients/activity.ts` và go-svc events endpoint.
