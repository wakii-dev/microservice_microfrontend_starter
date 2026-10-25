# SF-3 Context Pack — Remote tasks: TasksPage redesign + UX gaps
> Đọc file này THAY VÌ tự tổng hợp. Epic spec: `docs/superpowers/specs/2026-10-13-ui-redesign.md` (rev 3). Mindmap: `docs/superpowers/mindmaps/ui-redesign.wakii`.
> Depends: SF-1 (tokens + primitives + rspack css rule đã merge). WHY: Tasks là màn hình demo chính (walkthrough mục 4.2) — hiện là 1 component 181 dòng, select status + list 1 cột, bỏ lỡ DELETE/edit/assignee/pagination/filter mà API LÙN có sẵn.

## Spec slice (chỉ phần SF-3 chịu trách nhiệm)
1. Tách component: `TaskForm` / `TaskList` / `TaskItem` / `StatusSelect` — giữ export `default` + named `TasksPage` (MF expose `./TasksPage` cần default; đổi = breaking registry).
2. TaskItem: card layout responsive; `StatusBadge` dùng primitive Badge — status thường 3 giá trị + **"Gán thất bại" cho assignment_failed giữ `role="status"` + text nguyên văn** (walkthrough 4b + test contract; KHÔNG cho chọn assignment_failed trong select — PATCH cấm).
3. Per-item busy: Spinner + disable select khi PATCH đang bay (hiện không có — user không biết thao tác đang xử lý).
4. Edit inline title/description: nút sửa → input inline → save (PATCH)/cancel. API có sẵn (`updateTask` — mở rộng `src/api.ts` payload nếu cần).
5. Delete: nút xoá + confirm dialog → DELETE `/api/tasks/{id}` (API có sẵn, UI chưa có). Feed activity tự nhận task.deleted qua Kafka.
6. Assignee hiển thị **UUID rút gọn monospace + tooltip full** — KHÔNG resolve tên qua `/api/users` (ngoài endpoint pin + sai base URL dev). + createdAt hiển thị.
7. Pagination "Tải thêm": limit ≤100 + offset (API có sẵn) — hiển thị "x/total" đúng.
8. Filter theo status: `?status=` (API có sẵn) — chip/toggle bộ 3 writable status.
9. `src/api.ts` ĐƯỢC MỞ RỘNG: thêm params limit/offset/status cho `fetchTasks`, thêm `deleteTask` — đúng contract `contracts/openapi/tasks.yaml` (limit max 100, offset ≥0). KHÔNG gọi endpoint ngoài `/api/tasks*`.
10. Loading = Skeleton list (primitive), empty = EmptyState (giữ text "Chưa có task nào" semantics), error banner giữ `role="alert"` + message 503 spring nguyên văn.
11. Scoped css riêng theo kiến trúc CSS đích (tokens + scoped classes, KHÔNG element selectors toàn cục). SF-3∥SF-4 chạy song song — KHÔNG copy code SF-4.
12. Standalone `src/index.tsx`: banner debug đẹp — **rebase trên SF-1, KHÔNG revert import base+tokens** SF-1 đã thêm.
13. Tests: update chuỗi đổi + THÊM case: edit inline gọi PATCH đúng payload / delete gọi DELETE + confirm / load-more gọi offset / filter gọi ?status= / per-item busy.

## Interface contract
- Primitives + tokens theo hand-off (`docs/superpowers/designs/ui-redesign-direction.md`) — dùng đúng props API; cần variant mới → FLAG coordinator (fe-shared đóng băng).
- MF contract GIỮ: name `tasks`, expose `./TasksPage`, default export, publicPath prod `/remotes/tasks/`.

## Touch map (files SF-3 tạo/sở hữu)
```
frontend/remotes/tasks/src/TasksPage.tsx      [SỞ HỮU — tách component]
frontend/remotes/tasks/src/components/*.tsx   [MỚI — TaskForm/TaskList/TaskItem/StatusSelect]
frontend/remotes/tasks/src/styles.css         [MỚI — scoped]
frontend/remotes/tasks/src/api.ts             [SỬA — mở rộng params + deleteTask]
frontend/remotes/tasks/src/index.tsx          [SỬA — banner debug, giữ imports SF-1]
frontend/remotes/tasks/tests/*                [SỬA — update + thêm case]
frontend/shell/**, frontend/remotes/activity/**, frontend/shared/** [READ-ONLY]
rspack.config.mjs / env.d.ts                  [READ-ONLY — SF-1 đã xong]
contracts/**, platform/**, services/**        [READ-ONLY]
```

## ACCEPTANCE (user-visible)
- Trên UI mới qua :8080: tạo task → thấy trong danh sách card; sửa tiêu đề inline; đổi status (select busy trong lúc bay); xoá có confirm; filter theo status; "Tải thêm" nếu >limit; "x/total" đúng.
- Task item hiện assignee (UUID rút gọn) + createdAt.
- Saga 4b: assign `fail@demo.local` → badge "Gán thất bại" hiện rõ (role=status), KHÔNG có select status.
- Standalone :4001 mở trực tiếp: có style + banner debug.
- `pnpm test` + `pnpm typecheck` tasks xanh (12 case cũ update + case mới).

## Boundary (KHÔNG làm)
- KHÔNG đụng frontend/shell/** (SF-2), frontend/remotes/activity/** (SF-4), frontend/shared/** (đóng băng).
- KHÔNG đổi: STATUS_LABELS text nếu không bắt buộc (test contract), aria-label bộ tasks ("Quản lý tasks", "Form tạo task", "Danh sách tasks", "Trạng thái task <title>"), role=alert/status.
- KHÔNG gọi API ngoài /api/tasks*; KHÔNG thêm deps; KHÔNG merge vào main / tạo PR.
