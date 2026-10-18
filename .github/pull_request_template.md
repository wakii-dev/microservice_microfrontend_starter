<!-- Đủ mục dưới đây — PR thiếu evidence = review chậm. Chi tiết flow: docs/git-flow.md -->

## What & Why

<!-- Làm gì + vì sao. Đụng story/epic thì link Linear (FI-xx / VU-xx). -->

## Thay đổi

- <!-- bullet ngắn theo nhóm: code / contracts / CI / docs -->

## Cách verify (bắt buộc)

<!-- Lệnh đã chạy + kết quả. Ví dụ:
- `pnpm --filter shell test` → 43/43; `pnpm --filter @wakii-dev/ui-kit build-storybook` → PASS
- `bash scripts/smoke/e2e.sh` → PASS 8/8 (compose 10 services)
- Local repro bug trước fix → EXIT=1, sau fix → EXIT=0
-->

## Checklist

- [ ] CI xanh trên PR (kể cả `convergence`)
- [ ] Không đụng READ-LOCKED (`app/shared/src/*.ts` + `mfToolkit`) ngoài epic đã duyệt
- [ ] Đụng contract → sync đủ bề mặt (node codegen / go snapshot bit-identical / fixtures 2 đầu)
- [ ] Không đụng `frontend/` paths cũ (đã rename `app/` từ 2026-10-17 — refs `frontend/` = bug)
- [ ] Descriptor sync (CLAUDE.md / orca.yaml / agents) nếu đổi cấu trúc, port, lệnh
- [ ] Docs/evidence cập nhật (walkthrough, ADR nếu đổi kiến trúc, screenshot nếu đổi UI)
