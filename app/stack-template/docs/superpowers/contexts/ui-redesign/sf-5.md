# SF-5 Context Pack — Convergence: browser walkthrough + docs + security
> Đọc file này THAY VỊ tự tổng hợp. Epic spec: `docs/superpowers/specs/2026-10-13-ui-redesign.md` (rev 3). Mindmap: `docs/superpowers/mindmaps/ui-redesign.wakii`.
> Depends: SF-2, SF-3, SF-4 (SF-1 transitively) — dest khi fork đã đủ cả 3 surface. WHY: epic chỉ "xong" khi NGƯỜI đi hết walkthrough mục 4/4b trên UI mới — CI e2e là API-level, không nhìn UI; đây là human gate duy nhất của story.

## Spec slice (chỉ phần SF-5 chịu trách nhiệm)
1. **Rule 0 browser walkthrough trên compose :8080** (stack chạy `cd platform && docker compose up -d` + topics đã tạo theo README; e2e smoke PASS trước) — theo đúng 8 acceptance epic: login → nav active → Tasks CRUD (tạo/sửa inline/xoá/đổi status/filter/Tải thêm) → Activity phản ánh (feed Kafka) → **saga 4b**: assign `fail@demo.local` → badge "Gán thất bại" → re-assign bob + PATCH status todo → về luồng thường → kill 1 remote dev → shell còn nguyên + fallback "Thử lại" → standalone :4001/:4002 có style. Screenshot evidence vào `docs/superpowers/evidence/` (BEFORE/AFTER từng màn).
2. Responsive spot-check 375px (devtools mobile): 3 màn hình chính không overflow ngang.
3. Full suite: `pnpm -r test` + `pnpm -r typecheck` (3 package) + `pnpm -r build` prod; xác nhận `git diff pnpm-lock.yaml` rỗng.
4. Docs sync (SF-5 sole owner docs): `docs/walkthrough.md` mục 4/4b đối chiếu UI mới (label/badge đổi = update, kèm screenshot mới nếu cần); `README.md` repo-map (fe-shared thêm "design tokens + UI primitives"); `frontend/*/README.md` mô tả import tokens/primitives.
5. Security pass cuối: diff toàn story không chứa secrets/.env; không exec-bit mới; không asset ngoài (CSP untouched); xác nhận `scripts/smoke/e2e.sh` vẫn PASS (UI redesign không đụng CI — chứng minh bằng chạy 1 lần).
6. Scaffold sanity verify-only: chạy `bash scripts/scaffold/scaffold.sh /tmp/<tên>` → output có `frontend/shared/src/{styles,ui}` (design system theo project mới) → `pnpm install --no-frozen-lockfile` + build shell output OK → xoá output.
7. Improvements-log: patterns story này (ghi `docs/superpowers/improvements-log.md`).
8. Report (KHÔNG fix) bug product thấy được trong services/FE — SF sở hữu fix qua coordinator.

## Touch map (files SF-5 tạo/sở hữu)
```
docs/walkthrough.md                    [SỞ HỮU — sync UI mới]
README.md                              [SỬA — repo-map + đoạn FE]
frontend/{shell,remotes/*/}/README.md  [SỬA — import tokens/primitives]
docs/superpowers/evidence/ui-redesign/ [MỚI — screenshots]
docs/superpowers/improvements-log.md   [SỬA — patterns]
frontend/**, services/**, platform/**  [READ-ONLY toàn bộ — bug = report coordinator]
scripts/**, .github/**, contracts/**   [READ-ONLY]
```

## ACCEPTANCE (user-visible)
- Người walkthrough xác nhận PASS 8/8 acceptance epic (mục Acceptance spec) trên UI mới — saga 4b badge nhận diện rõ, fallback remote-down hoạt động.
- 375px: 3 màn chính dùng được, không overflow ngang (screenshot).
- `pnpm -r test` + `typecheck` + `build` 3 package xanh; `pnpm-lock.yaml` không đổi; `scripts/smoke/e2e.sh` PASS.
- Security pass: 0 P0/P1. Scaffold output chứa design system + build được.
- Docs walkthrough đọc được một người mới đi từ đầu trên UI mới.

## Boundary (KHÔNG làm)
- KHÔNG fix business logic / styling bugs của SF-2/3/4 (report coordinator — SF owning xử lý, có thể cần SF-5 chạy vòng 2 sau khi fix).
- KHÔNG đổi code FE trừ docs; KHÔNG merge vào main / KHÔNG tạo PR (coordinator làm).
- KHÔNG thêm tính năng mới — hội tụ + chứng minh + docs.
