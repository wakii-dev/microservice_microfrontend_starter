# SF-4 Context Pack — spring-svc @Transactional demo
> Đọc file này THAY VÌ tự tổng hợp. Epic spec: `docs/superpowers/specs/2026-10-13-kafka-outbox-saga.md` (rev 3). Mindmap: `docs/superpowers/mindmaps/kafka-outbox-saga.wakii`.
> KHÔNG depends-on SF-1 — chạy song song từ tier 0 (false dep đã cắt: rollback trigger dùng alice@demo.local có sẵn; không đụng kafka/compose/file SF-1 sửa).

## Spec slice (chỉ phần SF-4 chịu trách nhiệm)
1. `service/TeamService.java` (MỚI — service layer, hiện TeamController gọi thẳng TeamRepository): method tạo team + members qua **N step** (≥2 lệnh ghi: teams.save + members từng dòng qua repository), có step GIỮA chừng có thể fail — annotate `@Transactional`.
2. Endpoint (delegate từ TeamController sang TeamService): tạo team kèm members; **trigger rollback deterministic: member email trùng `alice@demo.local`** (fixture CÓ SẮN trong users.json — không cần SF-1) → bước insert member đó throw → **rollback toàn bộ** (team + members trước đó cùng biến mất) → error envelope 409/422 theo conventions.
3. `TeamController.java` sửa: delegate sang TeamService (giữ contract yaml — không đổi API path/shape).
4. Tests: (a) happy path — team + members tạo đủ; (b) **rollback assert** — fail giữa chừng → team KHÔNG tồn tại trong DB sau request (verify qua repository, không chỉ response); (c) chạy trên postgres service container trong CI (`mvnw verify` — CI-verifiable, dev machine không JDK/Docker không sao).
5. README spring-svc: section @Transactional demo + giải thích Situation A (nhiều step 1 DB = 1 tx là đủ, so sánh Situation B cross-service → trỏ sang saga node/go).

## Touch map (files SF-4 tạo/sở hữu)
```
services/spring-svc/**                [SỞ HỮU — service/ mới, web/TeamController sửa, tests]
```

## ACCEPTANCE (user-visible)
- POST team với members hợp lệ → 201, team + members trong DB.
- POST team với member trùng alice@demo.local ở vị trí giữa → error envelope, **DB không có team lẫn members** (rollback assert qua repository).
- CI spring workflow xanh (mvnw verify + tests + boot-smoke hiện có không vỡ).

## Boundary (KHÔNG làm)
- KHÔNG dính Kafka/outbox/topic — SF-4 độc lập hoàn toàn.
- KHÔNG sửa users.json, compose, contracts, CI của service khác.
- KHÔNG đổi API contract teams (path/shape giữ nguyên).
- KHÔNG thử docker local — CI verify (mvnw wrapper có sẵn; JDK qua CI toolchain).
