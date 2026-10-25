# SF-1 Context Pack — Design direction + design-system nền móng
> Đọc file này THAY VÌ tự tổng hợp. Epic spec: `docs/superpowers/specs/2026-10-13-ui-redesign.md` (rev 3). Mindmap: `docs/superpowers/mindmaps/ui-redesign.wakii`.
> Depends: — (tier 0, SF đầu tiên). WHY: UI là "mặt tiền" boilerplate khi dev nội bộ fresh-clone demo — hiện gần như unstyled (CSS 68 dòng, 0 tokens, coupling CSS shell→remotes). SF này quyết định hướng thiết kế (USER CHỌN) và dựng nền móng mọi SF sau consume.

## Spec slice (chỉ phần SF-1 chịu trách nhiệm)
0. **DESIGN GATE ĐÃ XONG lúc CREATE** (2026-10-13): user đã chọn hướng **B "Linear-referenced dark"** — đọc `docs/superpowers/designs/ui-redesign-direction.md` (tokens + component props API ĐẦY ĐỦ, visual chuẩn `designs/drafts/b-reference.html`) + `designs/direction-approved.md`. KHÔNG chạy designer 3 hướng nữa — implement thẳng theo hand-off.
1. `fe-shared/src/styles/tokens.css` + `base.css` — ĐÚNG giá trị mục 1-2 hand-off (không tự chế thêm token; thiếu = flag coordinator).
2. `fe-shared/src/styles/tokens.css` — custom properties `:root`, idempotent (nhiều bản cùng giá trị vô hại — remote CSS inject runtime sau CSS shell). `fe-shared/src/styles/base.css` — `@layer reset,base` tối thiểu, GIỐNG HỆT mọi bản copy; shell là nơi import LÀM CHỦ global base (remote chỉ tokens + scoped classes).
3. Primitives `fe-shared/src/ui/`: `Badge` (role="status", variant enum phủ 4 status extended tasks: todo/in_progress/done/assignment_failed + 5 action labels activity: task.created/updated/assigned/deleted/assignment_failed), `EmptyState`, `Skeleton` (aria-busy), `Spinner`. **TS props API từng primitive document trong hand-off doc** — SF-2/3/4 consume theo đúng shape.
4. Barrel export + package.json exports map — CHỈ phần mới; 4 file logic fe-shared (api-client/token-storage/error-envelope/mf-bootstrap) READ-ONLY tuyệt đối, trường `mfToolkit` READ-LOCKED.
5. **Rspack ×3**: remotes thiếu css rule + `experiments.css` — copy y hệt shell (`frontend/shell/rspack.config.mjs:42-45,85-87`); `declare module '*.css'` env.d.ts ×3 (defensive); **`'react/jsx-runtime': {singleton:true, requiredVersion:false}` vào shared CẢ 3 config** (hiện chỉ react/react-dom — JSX fe-shared compile ra import jsx-runtime sẽ duplicate react).
6. **Spike R2 chạy SỚM** — ngay sau task 5 với 1 JSX stub tối thiểu trong fe-shared, TRƯỚC khi viết 4 primitives: build 3 package → load shell + remote mount + 1 tương tác đổi status → console KHÔNG có "Invalid hook call"/"2 copies of React" → screenshot vào `docs/superpowers/evidence/`. FAIL → fallback primitives **class-only** (không JSX — chỉ className helpers), hand-off ghi API shape thay thế.
7. `output.cssFilename: '[name].[contenthash].css'` prod ×3 (cache-busting; CSS emit ở ROOT — không nằm trong `/assets/` immutable, đừng tìm rule đó).
8. Remotes `src/index.tsx` (standalone debug :4001/:4002) import base+tokens — fix "standalone trơ trụi". SF-3/4 sẽ TIẾP TỤC sửa file này (banner debug) — giữ import, ghi comment rõ.
9. Tests primitives ở **`frontend/shell/tests/primitives.test.tsx`** (fe-shared KHÔNG có vitest — thêm vào sẽ đụng `pnpm-lock.yaml`, success criteria cấm đổi lockfile).
10. Ownership notes: comment `pnpm-workspace.yaml` (dòng SF-1 cũ sở hữu) + `frontend/shared/package.json` description + fe-shared README — ghi rõ từ story này: `src/styles/` + `src/ui/` do design-system SF sở hữu, logic files READ-LOCKED.
11. Demo: 1 trang HTML đơn giản render primitives (đính kèm hand-off hoặc standalone dev) — user thấy được design system sống.

## Touch map (files SF-1 tạo/sở hữu)
```
frontend/shared/src/styles/{tokens,base}.css        [MỚI — SỞ HỮU]
frontend/shared/src/ui/{Badge,EmptyState,Skeleton,Spinner}.tsx [MỚI — SỞ HỮU]
frontend/shared/src/index.ts                         [SỬA — barrel thêm export phần mới]
frontend/shared/package.json                         [SỬA — exports map + description; mfToolkit LOCKED]
frontend/shared/README.md                            [SỬA — cách import tokens/primitives]
frontend/{shell,remotes/tasks,remotes/activity}/rspack.config.mjs [SỬA — css rule + jsx-runtime shared + cssFilename]
frontend/{shell,remotes/tasks,remotes/activity}/env.d.ts [SỬA — declare *.css]
frontend/remotes/{tasks,activity}/src/index.tsx      [SỬA — import base+tokens]
frontend/shell/tests/primitives.test.tsx             [MỚI]
docs/superpowers/designs/ui-redesign-direction.md    [MỚI — sau USER GATE]
docs/superpowers/evidence/                           [spike R2 screenshot]
pnpm-workspace.yaml                                  [SỬA — comment ownership]
frontend/shared/src/{api-client,token-storage,error-envelope,mf-bootstrap}.ts [READ-ONLY]
contracts/**, platform/**, services/**, scripts/**, .github/** [READ-ONLY]
```

## ACCEPTANCE (user-visible)
- User được xem 3 hướng prototype đầy đủ (login + tasks + activity) và CHỌN 1 — hướng chưa chọn = SF chưa xong.
- Sau SF-1: mở standalone `http://localhost:4001` / `:4002` trực tiếp → có baseline style (không còn trơ trụi); primitives render đúng hand-off; 3 package `pnpm build` xanh; spike R2 PASS có screenshot (console sạch duplicate-react); `pnpm test` shell xanh kèm tests primitives.
- `pnpm-lock.yaml` KHÔNG đổi (0 deps mới).

## Boundary (KHÔNG làm)
- KHÔNG restyle shell/remotes pages (SF-2/3/4 — SF-1 chỉ nền móng + config).
- KHÔNG đụng 4 file logic fe-shared + trường mfToolkit; KHÔNG thêm npm dependency nào.
- KHÔNG tự chốt hướng thiết kế thay user (gate bắt buộc); KHÔNG thêm asset ngoài/CDN font (CSP chưa set).
- KHÔNG merge vào main / KHÔNG tạo PR (coordinator làm).
