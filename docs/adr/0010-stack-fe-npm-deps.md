# ADR 0010 — Stack scaffold cài `@wakii/ui-kit` từ npm (prune source design system)

Ngày: 2026-10-27 · Status: Accepted (user duyệt 2026-10-27)

## Context

Scaffold `create-wakii-stack` copy nguyên snapshot `app/stack-template`, vốn nhúng
source `app/ui-kit` (kế thừa consumption-qua-source của [ADR-0009](0009-ui-kit-split.md)).
Ba hệ quả khi design system đi theo source:

1. **Output nặng** — mỗi stack sinh ra mang theo ~500 file source kit (src + stories + config).
2. **Docker build chậm** — FE compile kit TS raw trong từng image (swc-loader include
   `(shared|ui-kit)/src`), lặp lại ở mọi service có UI.
3. **Fork ngầm design system** — project sở hữu bản copy không có đường nâng cấp
   (`pnpm update` không tác dụng với source copy), drift im lặng so với kit trong repo gốc.

Trong khi đó `@wakii/ui-kit` đã publish npm chính thức (npmjs canonical) — đường phân
phối đã sẵn sàng, chỉ chưa dùng cho scaffold.

## Decision

Áp dụng cho **output scaffold `create-wakii-stack`** (engine Hybrid C — template snapshot
giữ nguyên, mọi thao tác ở engine runtime):

1. **Prune `app/ui-kit`** khỏi output — thêm vào `ALWAYS_PRUNE` của engine (cùng nhóm
   scaffolders + spike).
2. **FE apps cài `@wakii/ui-kit` từ npm registry, dist-tag `latest`** — engine rewrite
   đúng các key đang `workspace:*` → `latest` trong package.json các FE app, rồi đồng bộ
   lockfile: `pnpm install --lockfile-only` trong dest; pnpm vắng mặt/thất bại → fallback
   bỏ cờ `--frozen-lockfile` khỏi Dockerfile. Kèm theo: thu pattern rspack swc-loader
   include `(shared|ui-kit)/src` → `(shared)/src`.
3. **`app/shared` (fe-shared) GIỮ nhúng** — consumed qua source (`workspace:*`) như cũ:
   chưa publish npm, logic nhỏ. Đây là giữ CỐ Ý, không phải bước trung gian chờ publish.
4. **Repo chính KHÔNG đổi** — 4 app FE trong repo vẫn consumed-qua-source; ADR-0009 giữ
   nguyên hiệu lực trong phạm vi repo.

## Consequences

- (+) Output scaffold gọn (~500 file kit source biến mất) + Docker build FE nhanh hơn
  (không compile kit source trong từng image).
- (+) Design system có đường nâng cấp tường minh: `pnpm update @wakii/ui-kit` trong
  project sinh ra — hết fork ngầm.
- (−) Scaffold phụ thuộc registry availability. Mitigation: `latest` được resolve và
  ghim vào `pnpm-lock.yaml` ngay lúc scaffold — các lần install sau không hỏi registry
  lại; nhánh fallback (unfreeze) giữ docker build không chết khi máy thiếu pnpm.
- (−) `latest` = hai stack sinh ở hai thời điểm có thể nhận kit version khác nhau
  (không tái lập tuyệt đối giữa các lần scaffold). Chấp nhận: template nội bộ, lockfile
  ghim sau lần đầu trong mỗi project.
- (−) Hai dạng consumption song song — repo qua source, stack qua npm. Chấp nhận có chủ
  ý; ranh giới ghi rõ: npm CHỈ cho output scaffold.
- Liên quan: [ADR-0007](0007-fork-not-upgrade.md) (fork-not-upgrade) vẫn đúng cho phần
  code còn lại — design system là dependency đầu tiên có upgrade path thay vì copy.
