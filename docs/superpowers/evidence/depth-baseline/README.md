# depth-baseline/ — BASELINE Design Depth pass (chụp 2026-10-19 00:5x)

14 grid × 9 component = **124 component** (mọi title component sống trên index :6006,
trừ Templates/* + Kitchen Sink). Method: lưới sống 3×3 — python http.server :6199
serve trang grid chứa 9 iframe `:6006/iframe.html?id=...` → Playwright chụp fullPage.

- Theme: **light cố định** (ép `data-bp-theme="light"` từng iframe + retry khi token rỗng).
- Script: `/tmp/v1-grid/capture6006.cjs` + trang grid `/tmp/v1-grid/grid-*.html` —
  AFTER phase chạy lại y hệt (đổi thư mục đích `depth-after/`).

## Caveats (đọc trước khi so)
1. Depth pass đã BẮT ĐẦU trước lúc chụp: một số component đã mang thay đổi đầu
   (vd panel-menu --wash/--ele-1) — baseline này = "đầu wave depth", không phải
   pre-depth tuyệt đối. So sánh trước/sau vẫn hợp lệ cho phần depth làm SAU thời điểm này.
2. Trong lúc chụp từng có cửa sổ CSS vỡ (HMR churn khi team edit tokens/dark) —
   script tự retry + verify token `--c-canvas` trước khi chụp; 14/14 xác nhận token OK.

## AFTER
Chạy lại cùng grid (components.json lưu `/tmp/v1-grid/components.json`) sau khi cả
đội xong → lưu `docs/superpowers/evidence/depth-after/` — PO duyệt bằng mắt.
