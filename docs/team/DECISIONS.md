# Standing Decisions — quyết định tiền-duyệt (workers tự thi hành, KHÔNG chờ lead)

Mục đích: cắt nút thắt lead. Worker gặp pattern dưới đây = quyết ĐÃ CÓ, làm ngay, ghi vào report.
Thêm quyết định mới do lead bổ sung sau mỗi lần phán vấn.

## Design & tokens
- D1. Thiếu token màu/radius/motion → TẠO token đúng namespace (không hex cứng), dark.css override nếu cần — pattern antd tương ứng là chuẩn mực.
- D2. Contrast chữ trên nền status: nền vàng/gold (st-doing) → chữ ink; nền xanh lá đậm/đỏ đậm → chữ trắng (antd parity).
- D3. Component third-party cần override CSS → var(--token) trong CSS string, comment nguồn (pattern Schedule FC skin).
- D4. Dark mode mất silhouette (surface tối trên tối) → dùng token surface sáng bậc (s2/s3 dark) thay black cứng.

## Quy trình
- P1. File dirty (git status M) của worker khác → KHÔNG đụng, ghi vào report/inbox nhắc owner.
- P2. Test fail ngoài scope mình = WIP người khác → bỏ qua trong verify, ghi rõ trong report.
- P3. Story CSF render-only với required-props → meta KHÔNG gắn component (đã là anti-pattern AGENTS.md).
- P4. Bug blocker gặp giữa mission → fix surgical nếu ≤10 dòng trong scope, quá thì report + chuyển việc kế (không chết đứng).
- P5. Cần teammate → inbox peer (docs/team/inbox/<tên>.md), không chờ lead trung gian.

## Scope
- S1. Phạm vi brief = hợp đồng đóng hộp; việc ngoài thấy cần → inbox/report, không tự sửa.
- S2. Apps Wakii: mỗi agent một app-dir; file shared (barrel/lockfile/package.json) = lead.
