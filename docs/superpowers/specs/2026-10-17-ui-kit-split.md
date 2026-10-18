# Spec: tách UI kit thành package riêng + Storybook Phase 1

Ngày: 2026-10-17 · Trạng thái: APPROVED (design duyệt trong chat cùng ngày) · Nguồn: thảo luận "lib UI cần storybook?" + "base component cần tách thư viện riêng"

## Bối cảnh

Sau story VU-53, design system (tokens + base + 4 primitives) sống trong `app/shared`
cùng 4 file logic READ-LOCKED (api-client/token-storage/error-envelope/mf-bootstrap).
Boundary "design system ≠ logic" bị trộn — SF design-system sau này phải đụng package
có vùng cấm. Đồng thời primitives chỉ được review qua screenshot ad-hoc, không có
catalog sống.

## Quyết định (đã duyệt)

1. **Package mới `app/ui-kit` (`@wakii-dev/ui-kit`)**: `src/ui/*` (Badge/EmptyState/Skeleton/
   Spinner) + `src/styles/{tokens,base}.css`. `app/shared` giữ 4 file logic (READ-LOCKED
   không đổi nội dung).
2. **Consumption QUA SOURCE** — giống fe-shared: main/types → src/, không build, không
   runtime dep (react types do consumer cung cấp; devDeps react chỉ cho test).
3. **Consumers đổi thẳng import** — không re-export cầu: UI stuff từ `@wakii-dev/ui-kit`,
   logic từ `@wakii/fe-shared`. 3 consumers (shell, remote-tasks, remote-activity).
4. **Storybook 9 + Vite builder trong ui-kit** (kèm luôn, không phase sau): stories cho
   4 primitives (đủ variants/states) + trang docs tokens. KHÔNG: stories cho MF views,
   visual-regression trả phí. Spike rút gọn: storybook dev-only, không đụng MF runtime
   pin-matrix — evidence = build-storybook PASS + dev screenshot, ghi trong commit.
5. Hạ tầng: Dockerfiles ×3 COPY ui-kit (lockfile importer cần package.json khi install
   frozen trong container); convergence copy-dir typecheck standalone CẢ fe-shared LẪN
   ui-kit (pattern @types/react + --jsx đã fix); CI workflow `ui-kit` mới (typecheck +
   test + build-storybook gate); ADR-0009; descriptor sync (CLAUDE.md, orca.yaml,
   agents/fe-dev, scaffold).

## Điều kiện chấp nhận

- `pnpm install --frozen-lockfile` PASS; 3 FE suites + typecheck + build xanh từ paths mới
- `bash scripts/smoke/e2e.sh` PASS trên compose rebuild (shell render primitives từ ui-kit)
- `pnpm --filter @wakii-dev/ui-kit build-storybook` PASS trong CI; stories cover mọi variants
- fe-shared standalone typecheck (copy-dir) vẫn PASS — không còn TS6142 sau khi ui/*
  rời đi; ui-kit standalone typecheck PASS với pattern @types/react
- Scaffold: project mới nhận ui-kit + storybook build được (CI scaffold-verify che build shell)

## Non-goals

- Build step/publish registry cho ui-kit; stories cho TasksPage/ActivityPage; Chromatic
  hoặc visual-regression; đổi MF pin-matrix.
