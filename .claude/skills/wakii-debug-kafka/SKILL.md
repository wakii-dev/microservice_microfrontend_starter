---
name: wakii-debug-kafka
description: Use khi debug Kafka trên boilerplate wakii — consumer không nhận event, assignment/feed rỗng, DLQ có event, saga "Gán thất bại" lạ, "kafka không chạy", lỗi topic. Gồm topic-trước-consumer, DLQ, smoke saga. KHÔNG dùng khi thêm consumer mới từ đầu (skill add-service + conventions/09), hay sửa contract event (skill sync-contracts).
---

# wakii-debug-kafka — topic trước consumer · DLQ · smoke saga

## Overview

Directives chẩn đoán Kafka cho stack wakii: node-svc outbox → relay → topic `task-events` → go-svc consumer idempotent (retry ×3 → `task-events.dlq`); saga assign `fail@demo.local` → compensation `assignment_failed`. Nguồn sự thật: `platform/conventions/09` + `docs/adr/0008` + `contracts/events/task-events.md`.

## Chẩn đoán theo triệu chứng

- IF consumer group `Stable` nhưng 0 fetch/0 commit, feed/assignment rỗng VĨNH VIỄN (không crash) THEN race join-group-trước-topic → `docker compose --env-file platform/.env down -v`; tạo topic `task-events` + `task-events.dlq` TRƯỚC (`kafka-init` one-shot + `EnsureTopics` go-svc) → up lại → tạo task → event phải về trong vài giây, KHÔNG cần restart service.
- IF DLQ có event THEN consumer đã retry ×3 fail — đọc payload trong DLQ (`kafka-console-consumer --topic task-events.dlq --from-beginning`) → fix nguyên nhân + reprocess; KHÔNG xoá DLQ.
- IF event nằm trong topic mà feed trống THEN check offset/group: `kafka-consumer-groups --bootstrap-server localhost:9092 --describe --group <group>` — LAG lớn = consumer kẹt; nhóm không tồn tại = sai group id.
- IF event KHÔNG có trong topic THEN lỗi phía outbox/relay node-svc — check bảng outbox (`status` chưa relay?) trước khi đổ lỗi Kafka.
- IF demo saga THEN assign task cho `fail@demo.local` → go consumer fail ×3 → `assignment_failed` → event vào DLQ; badge "Gán thất bại" hiện ở UI.

## Verify cuối

- THEN `bash scripts/smoke/e2e.sh` PASS (happy qua Kafka + saga → DLQ assert) — KHÔNG test tay lẻ rồi kết luận xong.
- IF đổi liên quan retry/idempotency THEN publish golden fixture từ `contracts/events/fixtures/` ×2 — tổng không đổi lần 2 (idempotency chứng minh được).

## Bẫy

- Kafka KHÔNG có data volume — `down` là mất topic; luôn tạo topic tường minh sau down (`kafka-init` lo khi compose up).
- Consumer KHÔNG subscribe trước topic (lazy-connect + topic trước boot — conventions/09).
- Dedupe bằng `envelope_id`, KHÔNG taskId (taskId đè lên nhau khi re-assign).
