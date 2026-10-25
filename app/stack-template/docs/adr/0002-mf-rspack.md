# ADR 0002 — Module Federation 2.0 trên Rspack (không Vite, không webpack)

Ngày: 2026-10-12 · Status: Accepted

## Context
Micro-frontend cần runtime remote loading (shell load remote độc lập deploy). Webpack MF ổn định nhưng build chậm; Vite MF chưa production-grade; Rspack + @module-federation/enhanced là chọn chính thống của MF 2.0.

## Decision
Rspack + @module-federation/enhanced, React 19. Versions PIN qua spike thực tế (`app/shared/package.json` trường `mfToolkit.pinned` — host :3000 load được remote :4001 đã test). Singletons (react, react-dom) qua pnpm catalog; remote khai `requiredVersion: false` tường minh (conventions/08 rule 4).

## Consequences
- (+) Build nhanh, MF runtime API đầy đủ (loadRemote), ecosystem MF 2.0.
- (−) Nâng cấp version = phải re-spike (không nâng vội); bundler KHÔNG trộn (tất cả FE cùng Rspack).
- (−) Gotcha đã học: `catalog:` literal rò vào requiredVersion (→ rule 4); native `import()` biến không được rewrite (→ fe-shared `loadRemoteModule`).
