# ADR 0005 — Fail-closed khi spring-svc down (validate assignee)

Ngày: 2026-10-12 · Status: Accepted

## Context
node-svc validate assignee tồn tại bằng REST call sang spring-svc. Spring down thì node nên từ chối ghi (fail-closed) hay ghi luôn (degrade, đối chiếu sau)?

## Decision
**Fail-closed**: spring không trả lời trong 2s → node-svc trả `503 DEPENDENCY_DOWN`, KHÔNG ghi task. Degrade (ghi luôn rồi đối chiếu) bị loại vì boilerplate demo mục đích giáo dục về dependency discipline; eventual consistency thêm phức tạp không cần cho sample.

## Consequences
- (+) Không bao giờ có task trỏ user không tồn tại; hành vi đoán được, dễ giải thích.
- (−) Availability node-svc bị chặn bởi spring-svc (một service down = không tạo được task có assignee). Phương án degrade khi copy dự án thật: ghi kèm trạng thái `assignee_pending` + job đối chiếu — điểm cắm tại `services/node-svc` user-validate client.
- (−) Health-gated compose đặt node-svc phụ thuộc spring healthy (SF-7) — thể hiện đúng ràng buộc này ngay từ boot.
