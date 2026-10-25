# SF-3 Spec — Remote tasks: TasksPage redesign + UX gaps (VU-56)

> Story VU-53 · slice canonical: `docs/superpowers/contexts/ui-redesign/sf-3.md` (đọc THAY VÌ tổng hợp lại) · epic spec rev 3: `docs/superpowers/specs/2026-10-13-ui-redesign.md` · direction: `docs/superpowers/designs/ui-redesign-direction.md` (hướng B — user đã duyệt ở CREATE)
> File này = brainstorm self-run (autonomous): holistic re-examination + design decisions mức SF. Epic-level questions đã trả lời hết ở epic spec — KHÔNG hỏi lại.

## Design decisions (self-answered theo conventions, BALANCED)

| # | Câu hỏi brainstorm | Quyết định | Lý do |
|---|---|---|---|
| 1 | State sống đâu? | `TasksPage` owns: `tasks[]`, `total`, `loading`, `loadingMore`, `error`, `statusFilter`. `TaskForm` owns inputs của mình; `TaskItem` owns `editing`/`confirming`/`busy` cục bộ | Decomposition spec slice #1; busy per-item là UI cục bộ (spec slice #3) |
| 2 | `fetchTasks` signature? | `fetchTasks(params?: { limit?; offset?; status? })` — query builder clamp limit 1..100 (mặc định `TASKS_PAGE_SIZE = 10`), offset ≥ 0, status chỉ khi có. Luôn gửi `limit` + `offset` | Contract `tasks.yaml` (limit max 100, offset ≥ 0); page size 10 để "Tải thêm" hiện sớm trong demo |
| 3 | aria-label "Tiêu đề" trùng giữa form tạo và form sửa? | Edit inputs dùng aria-label riêng: `Sửa tiêu đề task <title>` / `Sửa mô tả task <title>` | Tránh ambiguous getByLabelText trong test + accessible name rõ hơn cho màn đọc |
| 4 | Confirm xoá: `window.confirm` hay inline? | Inline 2 bước trong item: nút "Xoá" → text "Xoá task này?" + [Xác nhận xoá] [Huỷ] | jsdom/userEvent không mô phỏng native confirm tốt; inline confirm style được theo hand-off (no-shadow, surface ladder); buttons đặt tên distinct cho test |
| 5 | aria-label `Trạng thái task <title>` trên badge sao cho KHÔNG đụng fe-shared (đóng băng — `BadgeProps = {variant, children}`)? | Bọc `<span role="status" aria-label="Trạng thái task <title>">` quanh `<Badge>` — query role=status theo name vẫn khớp test cũ, text "Gán thất bại" nguyên văn qua children | Không sửa primitive; giữ đúng contract a11y (boundary: KHÔNG đổi aria-label bộ tasks) |
| 6 | Per-item busy hiển thị thế nào? | Khi busy: `Spinner` (label `Đang xử lý task <title>`) THAY badge (hand-off §4 "Spinner thay dot") + disable select + disable nút Sửa/Xoá | Hand-off §4 task row; chống double-submit |
| 7 | Skeleton lúc load-more? | KHÔNG — giữ list, nút "Tải thêm" → "Đang tải thêm…" + disabled. Skeleton chỉ cho load đầu/tiêu đổi filter | Tránh list nhảy layout; loading state rõ ràng hơn |
| 8 | Edit payload? | Chỉ gửi field THAY ĐỔI (minProperties 1 theo contract); cả hai không đổi → thoát edit không gọi PATCH; title rỗng → không gửi | `UpdateTaskRequest` minProperties 1; description rỗng gửi `''` (contract cho phép string) |
| 9 | Assignee hiển thị? | `null` → "Chưa gán"; có → `<code title={full}>` 8 ký tự đầu + "…" monospace; KHÔNG resolve tên (boundary) | Spec slice #6 |
| 10 | createdAt format? | `Intl.DateTimeFormat('vi-VN', {2-digit date + hour/minute})` render trong `<time dateTime={iso}>`; test không assert chuỗi locale (ICU variance) — assert `/2026/` + dateTime attr | Hand-off §4 "thời gian vi-VN"; test bền |
| 11 | Empty khi đang filter? | Vẫn `EmptyState` title "Chưa có task nào" (giữ semantics — boundary), description đổi theo ngữ cảnh (bỏ lọc / thử bỏ bộ lọc) | Spec slice #10 + boundary giữ text |
| 12 | CSS scope? | File `src/styles.css` import trong `TasksPage.tsx`, mọi selector prefix `.tsk-`, KHÔNG element selector toàn cục, chỉ ăn tokens `--c-* --ink* --line* --accent* --st-* --sp-* --fs-* --r-*`; media ≤768px stack card | Spec slice #11 + epic quyết định #5 (remote chỉ tokens + scoped) |
| 13 | `index.tsx` hay `standalone.tsx` chứa banner? | `standalone.tsx` (SF-1 đã tách render ra khỏi async boundary). `index.tsx` GIỮ NGUYÊN — boundary `import('./standalone')` là contract RUNTIME-006 | Touch map ghi "index.tsx SỬA banner debug" — thực chất banner nằm ở file render; surgical scope giữ boundary không đụng |
| 14 | MF contract? | Giữ nguyên: `TasksPage.tsx` export named `TasksPage` + `export default`; không đổi expose/name/publicPath | Boundary: registry pin |
| 15 | TDD? | Viết/trả test TRƯỚC theo API component mới (RED), implement tới XANH (GREEN); evidence ghi `tdd: RED→GREEN` | Gate story-verify TDD_MODE |

## Component tree

```
TasksPage (state owner, error banner, filter chips, skeleton/empty/load-more)
├── TaskForm            — tạo task (aria-label "Form tạo task" giữ nguyên)
├── FilterChips         — inline trong TasksPage: "Tất cả" + 3 writable (aria-pressed)
└── TaskList            — h2 "Danh sách (x/total)" + ul aria-label "Danh sách tasks"
    └── TaskItem        — card: badge/spinner + title/desc + meta (uuid, createdAt) + actions
        ├── StatusBadge — bọc Badge primitive (role=status + aria-label giữ nguyên)
        ├── StatusSelect— 3 writable, aria-label "Trạng thái task <title>", disabled khi busy
        └── edit/confirm inline UI
```

## Test kế hoạch (giữ 12 case cũ update + thêm ~10)

Component: render list + "x/total" · tạo task · 503 banner · empty · đổi status · assignment_failed badge KHÔNG select · select 3 option · **sửa inline PATCH đúng payload** · **huỷ sửa không gọi PATCH** · **xoá confirm gọi DELETE** · **huỷ xoá không gọi** · **Tải thêm gọi offset** · **filter gọi ?status=** · **per-item busy (select disabled + Spinner)** · **assignee UUID rút gọn + title full + createdAt** · **skeleton khi loading**.
API: fetchTasks default URL mới · fetchTasks đủ params + clamp · **deleteTask DELETE 204** · create/update/503/timeout giữ.

## Boundary (nhắc lại — từ context pack, không đổi)

KHÔNG đụng shell/**, activity/**, shared/** (đóng băng), rspack.config, env.d.ts, contracts; KHÔNG deps mới; KHÔNG merge/PR; STATUS_LABELS + aria-label bộ tasks + role=alert/status giữ nguyên văn.
