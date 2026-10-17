# SF-5 (VU-64) — Human walkthrough 2 tab + security evidence

> Chạy 2026-10-17 trên stack compose 10 services FRESH VOLUME (`down -v` → topics → up)
> tại worktree `sf-5-auth-real`, commit `a494dab`. Browser: Orca embedded browser
> (trusted CDP input). Screenshots: `docs/superpowers/evidence/sf-5-auth-real/sf5-*.png`.
> Log chi tiết test-run: `docs/superpowers/evidence/sf-5-auth-real/test-run.txt`.

## Walkthrough 2 tab (acceptance epic #5 — register→login→tab 2→logout-all→tab 1 chết ở request kế)

| Bước | Hành động | Kết quả QUAN SÁT THẬT (không phải DOM suy diễn) |
|---|---|---|
| 1 | Mở :8080 (build prod compose qua gateway) | Dashboard + nav + nút Đăng nhập + box TÀI KHOẢN DEMO — `sf5-01-before-login.png` |
| 2 | Login screen | Tablist ARIA "Chế độ đăng nhập hoặc đăng ký": Đăng nhập \| **Đăng ký** (SF-4) — `sf5-02-login-page.png` |
| 3 | Tab Đăng ký → register `walkthrough-<ts>@demo.local` / `walkthrough-pass-1` / "Walkthrough User" | 201 → **đăng nhập luôn**: nav hiện user chip + nút Đăng xuất — `sf5-03-registered-loggedin.png` |
| 4 | Tạo task `walkthrough-task-1` qua form Tasks (remote MF) | Danh sách 1/1 → 2/2, task hiện đầu list (DOM count + nhìn thấy) |
| 5 | Mở **tab 2** cùng account | Tab 2 login state hiển thị cùng user chip — `sf5-04-tab2-loggedin.png` |
| 6 | `POST /api/auth/logout-all` (Bearer) | **204** — revoke TẤT CẢ refresh token của user |
| 7 | Tab 1 thao tác kế (request với access token hết hạn — mô phỏng hết hạn 30m bằng cách set `bp.jwt` = token chết, đúng code path 401→refresh) | **Tab 1 chết**: request → 401 → auto-refresh (single-flight) → refresh bị revoke-all → 401 → clear 2 key (`bp.jwt` + `bp.rt`) → **về màn login** — `sf5-05-tab1-dead-after-logout-all.png` |
| 8 | Tab 2 cùng điều kiện | Tab 2 cũng về login screen (snapshot: link "Đăng nhập", không còn user chip) |

**Lưu ý trung thực**: logout-all KHÔNG giết tab NGAY — access JWT stateless TTL 30m còn hạn
thì request vẫn sống (đúng thiết kế token-contract: revoke chỉ tác động refresh). "Chết ở
request kế" = request ĐẦU TIÊN cần refresh sau khi access hết hạn. Bước 7 mô phỏng đúng
code path đó (không đợi 30m). Điều này đã ghi trong walkthrough.md mục 4a.

## RBAC demo trên UI (acceptance epic #4 + SF-3)

| Bước | Kết quả |
|---|---|
| bob (roles `["user"]`) login UI → Tasks → Xoá task `saga-demo-ui` (của alice) → Xác nhận xoá | **403 FORBIDDEN** — banner đỏ "Chỉ admin được xoá task" hiển thị, task CÒN NGUYÊN (4/4) — `sf5-06-bob-delete-403.png` |
| alice (roles `["admin"]`) login UI → Xoá cùng task → Xác nhận xoá | **204** — task biến mất, Danh sách 4/4 → 3/3 (DOM count) |
| e2e API-level cùng chuỗi | bước 11/15 (403 + envelope FORBIDDEN) + 12/15 (alice DELETE 204 theo tasks.yaml) PASS |

## Saga demo VẪN chạy (acceptance epic #1/#6)

- `saga-demo-ui-2` (tạo trên UI) → PATCH `assigneeId=55555555-…` (fail user) qua API →
  go consumer fail ×3 → compensating `task.assignment_failed` → node compensation UPDATE
  → GET task `status=assignment_failed` (API check) → **UI reload: badge "Gán thất bại"
  (pill đỏ chấm đỏ) + KHÔNG còn select status (system-owned)** — `sf5-07-saga-badge-live.png`.
- Card `smoke-saga-…` từ e2e 15 bước cũng badge "Gán thất bại" (e2e bước 14 + DLQ bước 15 PASS).

## Security pass

- security-audit độc lập trên diff `ce9ce7e..a494dab` (agent riêng): kết quả cuối được
  ghi ở `sf-5-auth-real/test-run.txt` + comment VU-64 (điền SAU khi audit trả verdict —
  không claim trước).
- Notes nhận biết đã có sẵn theo spec: localStorage `bp.rt` accepted-for-demo
  (rationale token-contract.md §2); `iss` pinned "auth-mock" (decision #7).

## Quirk tự khai báo (automation, KHÔNG phải app bug)

Orca browser coordinate-clicks thỉnh thoảng trượt trên element do REMOTE mount (element
trong shell nav/login vẫn click được; remote tasks mount cùng document, không iframe).
App behavior đã verify qua: (1) trusted clicks lúc đầu (register/login/tạo task đầu tiên
đều qua click thật), (2) `requestSubmit()`/`HTMLElement.click()` — cùng React handlers,
(3) fetch trực tiếp từ page context trả 201. Không có console error (0 errs qua hook).
