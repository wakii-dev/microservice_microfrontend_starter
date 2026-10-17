# ADR 0009 — Tách UI kit khỏi fe-shared (design system ≠ logic)

Ngày: 2026-10-17 · Status: Accepted

## Context

Sau story VU-53, design system (tokens + base css + 4 primitives) sống chung
`app/shared` với 4 file logic READ-LOCKED (api-client/token-storage/error-envelope/
mf-bootstrap). Boundary bị trộn: SF design-system phải đụng package có vùng cấm —
mỗi lần đụng tokens là một lần rủi ro chạm file locked. Đồng thời primitives chỉ
được review qua screenshot ad-hoc, không có catalog sống.

## Decision

- **Package mới `app/ui-kit` (`@wakii/ui-kit`)**: `src/ui/*` (Badge/EmptyState/
  Skeleton/Spinner) + `src/styles/{tokens,base}.css` + Storybook 9 (dev-only —
  build-storybook là gate CI workflow `ui-kit`, KHÔNG stories cho MF views,
  KHÔNG visual-regression trả phí).
- **`app/shared` chỉ còn 4 file logic** — READ-LOCKED giữ nguyên nội dung.
- Cả hai consumed **QUA SOURCE** (main/types trỏ `src/`, không build, không
  publish registry) — cùng pattern fe-shared.
- Consumers **import thẳng, không re-export cầu**: UI từ `@wakii/ui-kit`,
  logic từ `@wakii/fe-shared`.

## Consequences

- (+) SF design-system không còn lí do đụng vùng READ-LOCKED; ranh giới review rõ:
  tokens/primitives = ui-kit (tự do trong story), api/token/MF = fe-shared (locked).
- (+) Primitives có catalog sống (Storybook) — review variants/states bằng evidence
  build-storybook thay vì screenshot ad-hoc.
- (−) Thêm 1 workspace importer: Dockerfiles ×3 phải COPY `app/ui-kit` (frozen
  install trong container cần package.json mọi importer); lockfile lớn hơn.
- (−) Storybook là dev-dep nặng nhất workspace — chấp nhận: scoped trong ui-kit,
  không đụng MF runtime pin-matrix.
