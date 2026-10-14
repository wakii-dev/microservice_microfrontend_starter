# Plan — SF-3 ui-redesign: TasksPage redesign + UX gaps (VU-56)

> Story VU-53 · spec: `docs/superpowers/specs/2026-10-14-sf-3-ui-redesign.md` · slice canonical: `docs/superpowers/contexts/ui-redesign/sf-3.md`
> Worktree: `sf-3-ui-redesign-tasks` (nhánh `wakii-dev/sf-3-ui-redesign-tasks`, base = đích `wakii-dev/story-vu53-ui-redesign` @492d072 — SF-1 đã merge) · Tier: Full · TDD: RED→GREEN per task
> Commit: atomic per task, `feat(sf-3): …` / `test(sf-3): …`. KHÔNG merge, KHÔNG đụng shell/** + activity/** + shared/**.

## Phase 0 — Impact analysis (SF-scoped; epic đã có P0 10 chiều, đây là phần bám code thật của slice)

**Problem**: TasksPage 181 dòng 1 component — list 1 cột + select status; bỏ lỡ DELETE/edit/assignee/pagination/filter dù `tasks.yaml` có sẵn hết. Là màn hình demo chính (walkthrough 4.2) nhưng chưa xứng direction B.

**Touch map** (context pack — giữ nguyên): SỞ HỮU `frontend/remotes/tasks/**` (TasksPage.tsx, components/*.tsx MỚI, styles.css MỚI, api.ts, standalone.tsx, tests/*). READ-ONLY: shell/**, activity/**, shared/**, rspack.config.mjs, env.d.ts, contracts/**, platform/**, services/**. `index.tsx` giữ nguyên (async boundary RUNTIME-006).

**Second-order effects**: (1) `fetchTasks` đổi signature — consumer duy nhất là package này (grep xác nhận); (2) css chunk mới theo expose — shell đã có css experiment + runtime chunk fetch (SF-1 spike); (3) "x/total" giờ = số đã tải/total (load-more làm x tăng) — format chuỗi giữ nguyên cho test contract; (4) standalone :4101 origin không token → 401 banner là hành vi đúng (đã document trong banner).

**Alternatives đã cân**: window.confirm vs inline confirm → inline (testable + styled); sửa BadgeProps thêm aria-label vs bọc span → bọc span (fe-shared đóng băng); Skeleton lúc load-more vs nút busy → nút busy (không nhảy layout); PAGE_SIZE 10 vs 20 → 10 (demo thấy pagination sớm).

**Risks**: tên label trùng "Tiêu đề" (mît: aria-label riêng cho edit); nested role=status khi bọc Badge (chấp nhận — giữ contract aria-label); css import trong vitest (vite stub mặc định — verify khi chạy test); SF-2/SF-4 song song (mît: chỉ touch tasks/** + docs của mình).

**Dimensions sweep**: functional ✓ (13 mục slice) · technical ✓ (MF/css/scope) · data ✓ (clamp limit/offset đúng contract) · perf — skip (demo scale, list ≤100) · security ✓ (React escape text user; confirm chống xoá nhầm; không secrets/asset ngoài) · backward-compat ✓ (registry/aria/labels giữ) · UX ✓ (lõi của SF) · maintenance ✓ (tách 5 component) · operational — skip (không infra) · business ✓ (màn demo chính).

## Tasks

- [ ] T1 — `api.ts` mở rộng: `FetchTasksParams` (limit clamp 1..100 default 10 / offset ≥ 0 / status), `buildTasksPath`, `deleteTask` (DELETE 204); RED→GREEN `api.test.ts` (URL mới + params + clamp + delete + 404 envelope)
- [ ] T2 — Components RED: viết `TasksPage.test.tsx` mới đủ ~17 case theo component tree (sửa inline PATCH payload, xoá confirm DELETE, Tải thêm offset, filter ?status=, per-item busy, assignee/createdAt, skeleton) — chạy ĐỎ
- [ ] T3 — Components GREEN: `components/status.ts` (labels/variants/writable) + `StatusBadge` + `StatusSelect` + `TaskForm` + `TaskItem` + `TaskList` + `TasksPage` rewrite (state owner, filter chips, skeleton/empty/load-more, error banner 503 giữ) — chạy XANH
- [ ] T4 — `styles.css` scoped (`.tsk-*`, tokens, media ≤768px) + standalone banner debug đẹp (standalone.tsx, giữ import tokens+base SF-1)
- [ ] T5 — Full verify package: `pnpm test` + `pnpm typecheck` + `pnpm build` tasks — 3 lệnh xanh; ghi `docs/superpowers/evidence/sf-3-ui-redesign-tasks/test-run.txt` (HEAD hash + tdd line)
- [ ] T6 — Rule 0 browser verify 3 tầng: DOM eval + screenshot so direction + flow login→CRUD→filter→load-more→saga 4b badge→logout trên dev stack isolate (:3100 shell + :4101 tasks dev, backend compose) + standalone :4101
- [ ] T7 — Code-reviewer độc lập (cyan) trên diff SF → verdict APPROVED + CHECKLIST-4Q post lên VU-56; CHANGES-REQUESTED → fix → re-review
- [ ] T8 — Commit cuối: evidence hash sync (HEAD~1) + improvements-log + plan tick; push `-u origin wakii-dev/sf-3-ui-redesign-tasks`; chạy `~/.claude/bin/story-verify sf-3` — B1/B2/B2b/B3 phải PASS (B4 pending merge là trạng thái đúng của story-hub — coordinator merge)

## Exit criteria

Context pack ACCEPTANCE từng dòng kiểm được (T6 evidence); tests+typecheck xanh (T5); reviewer APPROVED (T7); gate B1/B2/B2b/B3 PASS (T8).
