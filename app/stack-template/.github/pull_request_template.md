<!-- Template cho AI mở PR — điền đủ, tick = ĐÃ CHẠY THẬT (không tick hộ).
     PR thiếu evidence = review chậm. Flow: docs/WORKFLOW.md · nhánh/merge: docs/git-flow.md -->

## What & Why

<!-- 1-3 dòng: làm gì + vì sao. Đụng story/epic → link Linear (FI-xx / VU-xx / SF-xx). -->

## Scope (path-group)

<!-- Nhóm file đổi. 1 PR = 1 path-group, không trộn drive-by edit. -->
- `app/…`: 
- `services/…`: 
- `docs/…`: 

## Verify evidence (bắt buộc — paste output THẬT, không tự bịa PASS)

- `pnpm verify:quick` → paste SUMMARY hoặc JSON:
- Tests: `<lệnh>` → `<số pass/fail>`
- Build (nếu đụng FE): `<lệnh>` → PASS

## Checklist AI

- [ ] `pnpm verify:quick` PASS (output paste ở trên)
- [ ] Tests vùng đụng PASS (ghi số test)
- [ ] Scope đúng path-group khai ở trên — không file thừa
- [ ] Conventional commit (`<type>(<scope>): <mô tả>`) + branch slug đúng `wakii-dev/<loại>-<slug>` (slug `[a-z0-9-]*`, không chấm/không hoa)
- [ ] Bugfix → regression test chặn tái phát (fail trước fix, pass sau fix)
- [ ] Đổi UI → ảnh browser thật (light + dark) đính kèm
- [ ] Đụng contract → sync đủ bề mặt (node codegen / go snapshot bit-identical / fixtures 2 đầu)
- [ ] Không đụng READ-LOCKED (`app/shared/src/*.ts` + `mfToolkit`) ngoài epic đã duyệt
- [ ] CI xanh trên PR khi Actions bật (`convergence` chạy mọi push)

## Next steps cho reviewer

<!-- Việc reviewer cần chạy/thêm, nếu có. Không có thì ghi "không". -->
