# Plan — SF-5 ui-redesign: Convergence — browser walkthrough + docs + security (VU-58)

> Story VU-53 · spec: `docs/superpowers/specs/2026-10-14-sf-5-ui-redesign.md` · slice canonical: `docs/superpowers/contexts/ui-redesign/sf-5.md`
> Worktree: `sf-5-ui-redesign-conv` (nhánh `wakii-dev/sf-5-ui-redesign-conv`, base = đích `wakii-dev/story-vu53-ui-redesign` @1a6a7aa — SF-1+2+3+4 đã merge) · Tier: **Full** (convergence — nhiều lớp verify)
> Commit: atomic per task, `docs(sf-5): …` / `test(sf-5): …`. KHÔNG merge, KHÔNG đụng `frontend/** services/** scripts/** platform/**` (READ-ONLY — bug = report coordinator).

## Phase 0 — Impact analysis (SF-scoped; epic đã có P0 10 chiều)

**Problem**: Story VU-53 có UI mới (SF-1..4 merged) nhưng CHƯA ai chứng minh 8/8 acceptance epic trên build compose thật qua trình duyệt; docs (walkthrough.md mục 4/4b, README repo-map, FE READMEs) còn mô tả UI cũ/trống; security pass cuối story chưa chạy. CI e2e là API-level — không nhìn UI (epic: human gate duy nhất).

**Touch map** (context pack — giữ nguyên): SỞ HỮU `docs/walkthrough.md`, `README.md`, `frontend/{shell,remotes/*}/README.md`, `docs/superpowers/evidence/ui-redesign/**` (mới), `docs/superpowers/evidence/sf-5-ui-redesign-conv/**` (mới — gate B1), `docs/superpowers/improvements-log.md`, spec/plan của mình. READ-ONLY toàn bộ còn lại (`frontend/** services/** platform/** scripts/** contracts/** .github/**`).

**Second-order effects**: (1) stack compose 10 container đang chạy 15h từ build story-đích — nội dung code = HEAD của nhánh đích = HEAD của nhánh SF-5 (SF-5 chỉ thêm docs → build vẫn đúng, không cần rebuild); (2) walkthrough tạo data thật (tasks) trên DB demo — chấp nhận (repo demo, người walkthrough cần data để thấy pagination/load-more); (3) kill container remote-tasks làm healthcheck đỏ tạm thời → start lại + đợi healthy trước khi kết thúc; (4) docs đổi nhãn UI = phải khớp NGHIÊM text thật trên màn (badge "Gán thất bại", nút "Tải thêm", "Thử lại") — lấy từ screenshot/DOM thực, không từ nhớ.

**Alternatives đã cân**: (a) walkthrough trên dev stack isolate như SF-2/3/4 → LOẠI, pack ép compose :8080 là chuẩn duy nhất; (b) 375px bằng CSS media-query analysis → LOẠI, Rule 0 đòi pixel thật — headless Chrome cùng build; (c) seed pagination data qua UI 11 lần → chỉ dùng khi thiếu, curl seed nhanh hơn nhưng vẫn đi CRUD qua UI; (d) tự tick human-gate 8/8 → CẤM, để coordinator relay user.

**Risks**: Orca CDP screenshot timeout (tái diễn SF-2/SF-24/SF-1) → fallback headless Chrome cùng build, khai báo trung thực (FI-464); saga badge trễ (retry ×3 backoff) → poll tối đa ~60s; container kill quên start lại → checklist khôi phục trước khi rời bước; `pnpm -r test` kéo cả node-svc/spike (workspace lớn hơn 3 FE package) → đọc output theo package, 3 FE package phải xanh.

**Dimensions sweep**: functional ✓ (8 acceptance = lõi) · technical ✓ (compose topology kill-remote, browser tooling) · data ✓ (demo data walkthrough tạo) · perf — skip (không code, không hot path) · security ✓ (security pass cuối story là deliverable) · backward-compat ✓ (docs-only, không đụng contract) · UX ✓ (375px + walkthrough đọc được bởi người mới) · maintenance ✓ (docs sync chống drift UI↔docs) · operational ✓ (stack sống + hướng dẫn human gate) · business ✓ (epic chỉ xong khi người đi hết walkthrough).

## Tasks

- [ ] T1 — Full suite: `pnpm -r test` + `pnpm -r typecheck` + `pnpm -r build` (3 FE package xanh) + `git diff pnpm-lock.yaml` rỗng → ghi `docs/superpowers/evidence/sf-5-ui-redesign-conv/test-run.txt` (hash + tdd line)
- [ ] T2 — e2e smoke PASS 1 lần chứng minh: `bash scripts/smoke/e2e.sh` (2 chiều happy+saga) → output vào evidence
- [ ] T3 — Rule 0 browser walkthrough 8/8 trên compose :8080 (3 tầng DOM/VISUAL/FLOW): login → nav active → Tasks CRUD (tạo/sửa inline/đổi status/xoá confirm/filter/Tải thêm + x/total) → Activity phản ánh (stats + feed vi-VN) → saga 4b (assign fail@demo.local → badge "Gán thất bại" → re-assign bob + PATCH todo → về luồng thường) → kill remote-tasks → shell còn nguyên + fallback "Thử lại" + retry OK → activity vẫn chạy → standalone :4001/:4002 có style. Screenshots → `docs/superpowers/evidence/ui-redesign/conv-*.png`
- [ ] T4 — Responsive 375px: 3 màn chính (Tasks/Activity/Home sau login) không overflow ngang — headless Chrome cùng build :8080, screenshots + DOM check `scrollWidth<=innerWidth` vào evidence
- [ ] T5 — Docs sync: `docs/walkthrough.md` mục 4/4b đối chiếu UI mới (nhãn/badge thật) + compose kill-remote; `README.md` repo-map (fe-shared design tokens + UI primitives); `frontend/shell/README.md` + `frontend/remotes/{tasks,activity}/README.md` import tokens/primitives
- [ ] T6 — Security pass: scan diff toàn story (secrets pattern, .env không track, exec-bit mới, asset ngoài/CSP untouched) + scaffold sanity verify-only (output có `frontend/shared/src/{styles,ui}` + build shell OK + xoá) → kết quả vào evidence
- [ ] T7 — `docs/superpowers/improvements-log.md`: patterns hội tụ của SF-5
- [ ] T8 — Code-reviewer độc lập (cyan) trên diff SF (docs/evidence) → APPROVED + CHECKLIST-4Q post VU-58; CHANGES-REQUESTED → fix → re-review
- [ ] T9 — Commit cuối + push `-u origin wakii-dev/sf-5-ui-redesign-conv` + `~/.claude/bin/story-verify sf-5` (B1/B2/B2b/B3 sạch; B4 pending merge = đúng story-hub) + worktree comment hướng dẫn walkthrough human gate + audit log VU-58. KHÔNG set Done Linear.

## Exit criteria

Context pack ACCEPTANCE từng dòng kiểm được (T3/T4 evidence); suite + smoke xanh (T1/T2); reviewer APPROVED (T8); gate B1/B2/B2b/B3 PASS (T9 — B4 pending merge là trạng thái đúng của story-hub, coordinator merge); stack :8080 còn sống + hướng dẫn walkthrough đã đẩy coordinator.
