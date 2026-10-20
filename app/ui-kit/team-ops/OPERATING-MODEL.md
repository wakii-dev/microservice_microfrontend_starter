# Wakii Team-OS — Hướng dẫn vận hành đội AI (đi kèm @wakii/ui-kit)

> Bộ component `Team-OS` trong kit (PingFeed · StagePipeline · DebtBoard · TeamDashboard ·
> InboxThread) + tài liệu này = **cài 1 package, có ngay hệ điều hành đội AI** trên máy nào.

## Cài đặt
```bash
pnpm add @wakii/ui-kit   # team-ops/ và Team-OS components đi kèm
```

## Khởi động đội (5 phút)
1. Đọc model này + phụ lục `team-ops/RULES.md`
2. Mỗi terminal chạy agent: chế độ tự chỉnh sửa toàn bộ (tự do chỉnh sửa tất cả — PO chuẩn thuận)
3. Chọn **chế độ đội** theo sức khỏe API (mục "3 chế độ")
4. Phân công theo hộp đóng + métier, khởi động giám sát 30 giây (mã nguồn giám sát mẫu ở cuối file)

## Vòng đời 1 việc (6 bước)
① Hộp đóng: `Phạm vi: CHỈ <dir> — ngoài CẤM` + lệnh xác minh + điểm DỪNG
② Agent nhận (chứng minh lượt chạy) → làm → tự xác minh (dán số thật)
③ BÁO CÁO ping → DỪNG chờ việc mới
④ Trưởng nhóm CỔNG ĐỘC LẬP ≤10 giây: chạy lại xác minh + đọc git diff
⑤ Commit gán tên → push · deploy theo mốc
⑥ Ghi vết dashboard; sai sót → thành luật trong cùng chu kỳ

## 3 chế độ đội (chuyển bằng đo tuổi-dữ-liệu + filesystem — không tin màn hình)
| Chế độ | Khi nào | Đội hình |
|---|---|---|
| TOÀN ĐỘI | API khỏe | toàn bộ agent song song |
| TẬP TRUNG-2 | throttle nhẹ | 2 mạch quan trọng nhất |
| TRỰC TIẾP | agent hỏng / chặn phát hành | trưởng nhóm tự làm |
⚖️ Không bao giờ để việc chờ khi đường ống hỏng.

## Giao tiếp
Active-ping 1 kênh chính (đúng định dạng cho `<PingFeed events>` trong kit) · ngang hàng hộp thư
(xuất ra `<InboxThread>` · `<TeamDashboard>` · `<DebtBoard>` · `<StagePipeline>` — mọi bảng đối soát
team render bằng chính kit này).

## Giám sát 30 giây (mẫu)
Đo tuổi-dữ-liệu của từng terminal mỗi 30 giây; >300 giây im lặng + preview rỗng → đánh thức;
giác màn hình glitch → cho agent ghi báo cáo ra tệp tạm.

## Chất lượng & phát hành
Cổng kiểm thử độc lập bằng số · pre-push là CI thật · bằng chứng ảnh trước/sau cho thị giác ·
thiết kế lớn qua 3 hướng → PO chọn · phát hành: cổng kiểm thử → commit → push → build → deploy → gắn thẻ.
