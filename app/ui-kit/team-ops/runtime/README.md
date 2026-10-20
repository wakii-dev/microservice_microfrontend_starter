# wakii-team-watch — runtime giám sát đội (0-dep, đi kèm kit)

Chạy (từ repo consumer, trỏ root dự án):
```bash
node node_modules/@wakii/ui-kit/team-ops/runtime/watch.mjs "$(pwd)"
# biến môi trường: WTW_INTERVAL=30000 (ms) · WTW_NOTIFY=0 (tắt thông báo macOS/Linux)
# nền: pm2 start ... --name wakii-team-watch (hoặc launchd)
```
Mỗi 30 giây: đo tuổi-output mọi terminal Orca (không tin màn hình) + đọc dòng cuối
(IDLE markers) + **bằng chứng filesystem** (file mới/sửa 10 phút) + tồn đư inbox.
Ghi `docs/team/HEALTH.json` — feed thẳng `<TeamDashboard>` của kit.
Trip-wires → thông báo OS bật lên tận mặt: IDLE · STALL · MAIL-BACKLOG ·
**THROTTLING (≥3 terminal im + 0 file mới → lệnh giảm đội hình TẬP-TRUNG/TRỰC-TIẾP)**.
Pattern detection mượn hang-watchdog của Wakii/Orca: heartbeat+tick, tick-gap guard
chống báo nhầm khi máy ngủ; tái khởi động an toàn (idempotent theo chu kỳ).
KHÔNG tự phân công/commit — runtime chỉ CẢNH BÁO; phán đoán vẫn của trưởng nhóm.
