---
name: wakii-publish
description: Use khi release/bump/publish npm package của wakii (@wakii/ui-kit, create-wakii-app, create-wakii-stack) — "publish bản mới", "bump version", "release ui-kit". Theo docs/WORKFLOW.md §4 + app/ui-kit/RELEASE.md. KHÔNG dùng khi release không phải npm package, hay chỉ bump nội bộ chưa publish.
---

# wakii-publish — release npm package có checkpoint

## Overview

Luồng docs/WORKFLOW.md §4 dạng directive. Publish = outward action — mỗi checkpoint có gate; DỪNG ở bước cần auth/token user, không tự vượt.

## Directives

1. IF bắt đầu THEN `git fetch origin && git pull` — publish CHỈ từ main mới nhất (main stale từng đè version — create-wakii-stack 0.1.9).
2. IF bump THEN version + mục `CHANGELOG.md` cùng commit; BREAKING → major (0.x: minor); KHÔNG đổi version đã publish ra ngoài.
3. THEN tự kiểm tarball: `npm pack` + `tar -tzf` — đủ CSS/tokens/assets/template, đúng bit `+x` (tarball copy tay từng mất CSS tokens — chỉ lộ ở consumer).
4. IF tarball thiếu THEN sửa publish script + guard file sống còn TRƯỚC, không publish thiếu.
5. THEN publish qua script có sẵn: `bash app/<pkg>/scripts/publish-npm.sh` (tự build + guard + `--access public`) — KHÔNG `npm publish` tay.
6. THEN ĐỢI 2–5 phút propagate → verify từ registry: `npm view <pkg> versions` + dist-tags; starter package: `npx <pkg>@latest` thử ngoài repo. KHÔNG publish lại vì tưởng hỏng.
7. IF version mới chưa thấy sau 10 phút THEN `npm whoami` + đọc log script — fix rồi bump version MỚI (version chiếm rồi là vĩnh viễn).
8. THEN log `docs/team/TEAM.md` + báo kết quả thật kèm bằng chứng (output `npm view` / npx).

## Mirror registry

- IF org cần bản nội bộ THEN GitHub Packages mirror (`@wakii-dev/*`, `npm.pkg.github.com`) — npmjs vẫn canonical; checklist 2 registry: `app/ui-kit/RELEASE.md`.
