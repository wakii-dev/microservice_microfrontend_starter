# Changelog — create-wakii-app

## [2.0.0] — 2026-10-29

### Changed (auto — 4d12760..4d12760 qua CI workflow publish-packages)

- (không có commit chạm app/create-wakii-app/ trong range 4d12760..4d12760 — bump only)
## [1.0.0] — 2026-10-29 (STABLE)

7 presets × 4 variants (vite/next/astro/remote) × TS/JS, AGENTS.md working agreement v0.2 trong từng template, @wakii/ui-kit 1.0.0, golden-path CI xanh.

## [0.3.0] — 2026-10-28

### Added
- `--dry-run`: xem files sẽ được tạo, không ghi đĩa
- JS variants cho preset `minimal` + `landing` (`--lang js`)
- Admin preset: dashboard có Chart thật (engine merge `_deps.json` của overlay)
- Node version guard (cảnh báo rõ khi < 22)
- README npm: bảng "which preset", banner; package metadata: homepage/bugs; mô tả sản phẩm chuẩn EN

### Fixed
- Pin `@wakii/ui-kit` mọi template → `^0.7.1` (caret 0.x không nhảy minor — starter từng rơi 0.6.8)
- Description npm còn TODO nội bộ `/tmp/starter-spec.md`

## [0.2.x] — 2026-10-26/27

- 0.2.4: pin bump ^0.7.1 (0.2.3 polish showcase split + Chart README + ProtectedRoute)
- 0.2.2: preset `landing`; CI golden-path workflow (chờ Actions bật)
- 0.2.1: preset system demo|minimal|product|admin + variants next/astro (0.2.0 staged-hỏng — bỏ)

## [0.1.x] — 2026-10-24/25

- 0.1.5: logo W; 0.1.3: bundle templates vào tarball; 0.1.2: extras overlays + markers
