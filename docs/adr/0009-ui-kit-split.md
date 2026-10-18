# ADR-0009: tách UI kit khỏi fe-shared — design system ≠ logic

Ngày: 2026-10-17 · Trạng thái: Accepted

## Bối cảnh

Sau VU-53, design system (tokens + base css + primitives Badge/EmptyState/Skeleton/Spinner)
sống trong `app/shared` cùng 4 file logic READ-LOCKED (api-client, token-storage,
error-envelope, mf-bootstrap). Hệ quả: (1) SF design-system làm việc trong package có
vùng cấm — mỗi PR phải cẩn thận không đụng file READ-LOCKED; (2) primitives không có
catalog sống — review bằng screenshot ad-hoc; (3) stories/consumer hand-off không có
nơi trỏ tới.

## Quyết định

1. **Package mới `app/ui-kit` (`@wakii/ui-kit`)** sở hữu trọn vẹn design system:
   `src/ui/*` + `src/styles/{tokens,base}.css`. `app/shared` thu hẹp thành logic-only.
2. **Consumption QUA SOURCE** như fe-shared — không build, không dist, KHÔNG runtime
   dependency (react types do consumer cung cấp qua tsconfig paths / resolve.modules;
   `react` trong devDependencies chỉ phục vụ test + storybook). Giữ 1 cơ chế duy nhất,
   tránh 2 dạng consumption trong cùng repo.
3. **Consumers đổi thẳng import** (`@wakii/ui-kit` cho UI, `@wakii/fe-shared` cho logic)
   — không re-export cầu: template nội bộ, 3 consumers, tests che đủ; lớp gián tiếp
   chỉ thêm nợ dọn.
4. **Storybook 9 + Vite builder sống trong ui-kit** (dev-only, không đụng MF runtime
   pin-matrix): stories cho primitives + docs tokens đọc var(--*) trực tiếp. Gate CI =
   build-storybook PASS, KHÔNG publish, KHÔNG visual-regression service.
5. rspack include regex của 3 FE package compile `(shared|ui-kit)/src` — cả 2 là TS raw.

## Hệ quả

- SF design-system sau này làm việc trong `app/ui-kit` không đụng vùng READ-LOCKED.
-. READ-LOCKED boundary của fe-shared giữ nguyên diện tích (4 file logic + mfToolkit).
- Convergence copy-dir typecheck standalone CẢ 2 package (ui-kit cần @types/react +
  `--jsx` — pattern fix 2026-10-17, run 39000358809).
- Dockerfiles ×3 COPY `app/ui-kit` (importer trong lockfile cần package.json khi
  install frozen trong container).
- Storybook bump major = đụng devDeps của ui-kit; KHÔNG bắt buộc re-spike MF (không
  nằm trong runtime share-scope), nhưng phải giữ `build-storybook` xanh trong CI.
