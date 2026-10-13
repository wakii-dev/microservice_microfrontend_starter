# SF-4 Context Pack — Remote activity: ActivityPage redesign
> Đọc file này THAY VÌ tự tổng hợp. Epic spec: `docs/superpowers/specs/2026-10-13-ui-redesign.md` (rev 3). Mindmap: `docs/superpowers/mindmaps/ui-redesign.wakii`.
> Depends: SF-1 (tokens + primitives + rspack css rule đã merge). WHY: Activity chứng minh chuỗi Kafka (outbox → topic → go consumer) phản ánh thao tác Tasks — hiện stats tile inline-style + feed dòng text phẳng, khó "đọc" activity theo thời gian.

## Spec slice (chỉ phần SF-4 chịu trách nhiệm)
1. Stats: grid layout responsive + StatTile cards dùng tokens — **giữ nguyên bộ aria-label** ("Thống kê tasks", "Tổng số task", "Task Cần làm/Làm/Xong", "Sự kiện 24h qua").
2. Feed: timeline theo nhóm ngày (mỗi nhóm heading ngày) + item card: action badge (primitive Badge, variant theo 5 action labels) + userName/taskTitle đậm + time vi-VN (`toLocaleString('vi-VN')` giữ).
3. Unknown action: fallback render nguyên văn (giữ hành vi hiện tại).
4. Nút "Làm mới": styling + busy state (Spinner, disable khi đang tải).
5. Loading = Skeleton FEED + STATS RIÊNG BIỆT — giữ `Promise.allSettled` independence (stats fail KHÔNG che feed, ngược lại — có test).
6. Empty = EmptyState primitive hướng dẫn sang Tasks ("Chưa có hoạt động nào — tạo một task ở trang Tasks…" semantics giữ).
7. Scoped css riêng theo kiến trúc CSS đích (mục "Kiến trúc đích" spec — tokens + scoped classes). SF-3∥SF-4 chạy song song — KHÔNG copy code SF-3.
8. Standalone `src/index.tsx`: banner debug đẹp — **rebase trên SF-1, KHÔNG revert import base+tokens**.
9. Tests: update + THÊM (stats grid aria-label giữ, skeleton xuất hiện lúc loading từng khu).
10. Diff-hygiene cuối SF (phase-gate security Phase 2).

## Interface contract
- Primitives + tokens theo hand-off (`docs/superpowers/designs/ui-redesign-direction.md`); Badge variant enum phủ 5 action labels — SF-1 đã cam kết; thiếu variant → FLAG coordinator.
- MF contract GIỮ: name `activity`, expose `./ActivityPage`, default export, publicPath prod `/remotes/activity/`.

## Touch map (files SF-4 tạo/sở hữu)
```
frontend/remotes/activity/src/ActivityPage.tsx  [SỞ HỮU — redesign]
frontend/remotes/activity/src/components/*.tsx  [MỚI — StatTile/Timeline/FeedItem nếu tách]
frontend/remotes/activity/src/styles.css        [MỚI — scoped]
frontend/remotes/activity/src/index.tsx         [SỬA — banner debug, giữ imports SF-1]
frontend/remotes/activity/tests/*               [SỬA — update + thêm]
frontend/remotes/activity/src/api.ts            [SỬA tối thiểu — KHÔNG đổi call shape hiện có]
frontend/shell/**, frontend/remotes/tasks/**, frontend/shared/** [READ-ONLY]
rspack.config.mjs / env.d.ts                    [READ-ONLY — SF-1 đã xong]
contracts/**, platform/**, services/**          [READ-ONLY]
```

## ACCEPTANCE (user-visible)
- Qua :8080: stats là các card trong grid responsive; feed dạng timeline theo ngày, mỗi item có badge action + tên người + task + giờ vi-VN đọc được.
- Tạo/sửa/xoá/assign task ở Tasks (SF-3) → reload Activity: sự kiện mới xuất hiện đúng badge (kể cả task.deleted).
- Nút "Làm mới" có busy state; stats fail vẫn xem được feed (và ngược lại).
- Standalone :4002 mở trực tiếp: có style + banner debug.
- `pnpm test` + `pnpm typecheck` activity xanh.

## Boundary (KHÔNG làm)
- KHÔNG đụng frontend/shell/** (SF-2), frontend/remotes/tasks/** (SF-3), frontend/shared/** (đóng băng).
- KHÔNG đổi ACTION_LABELS text + aria-label bộ activity ("Activity feed và thống kê", "Danh sách hoạt động", stats labels), KHÔNG bỏ Promise.allSettled independence.
- KHÔNG gọi API ngoài /api/activity/*; KHÔNG thêm deps; KHÔNG merge vào main / tạo PR.
