# Spike R2 — fe-shared JSX qua MF boundary (SF-1, story VU-53)

- **Ngày**: 2026-10-14 · worktree `sf-1-ui-redesign-dsys` · exit criteria theo pack slice mục 6.
- **Setup**: JSX stub `fe-shared/src/ui/jsx-probe.tsx` (useState + onClick) temp-render trong
  exposed module `TasksPage` (tasks remote); dev servers riêng ports 3100/4101/4102
  (FE docker compose chiếm 3000/4001/4002 — CORS_DEV_ORIGIN compose-time không có ports mới
  → devServer.proxy dev-only ×3 trong config, remote chạy same-origin page của shell).
- **Build**: 3 package `pnpm build` xanh (prod, contenthash) — shell/tasks/activity.

## Kết quả flow (Orca browser, trusted input)

| Bước | Kết quả |
|---|---|
| login :3100 (`alice@demo.local`) | PASS → navigate `/` |
| `/tasks` remote mount qua MF | PASS — h1 "Tasks", probe render |
| click probe (useState trong fe-shared qua MF) | PASS — "hooks OK (0)" → "(1)" |
| đổi status select row 1 `todo` → `done` | PASS — PATCH + reload, select persist "Xong" |
| console collector (error/unhandledrejection/console.error) | **[] SẠCH** — 0× "Invalid hook call", 0× "2 copies of React" |

## DOM tier (eval)

- probe text: `[spike-R2] JSX probe — hooks OK (1)` sau click
- `li` = 7, `select` = 4 (3 writable + 1 trạng assignment_failed hiển badge), `[role=alert]` = null
- statuses sau flow: `["done","todo","todo","todo"]` (row 1 đã đổi)

## Visual tier

- `spike-r2-shell-3100-tasks.png` — shell :3100 tasks mount + probe + status đổi (UI cũ chủ đích — SF-2/3 restyle).

## Finding quan trọng (goes vào configs, đã fix trong SF-1)

1. **fe-shared KHÔNG có react dep** (đúng — giữ lockfile) → import 'react' từ src/ui không
   resolve upward. Fix: `resolve.modules = [consumer node_modules, 'node_modules']` ×3 rspack
   config (react 19.3.0 catalog-pinned giống hệt ×3; MF singleton vẫn 1 bản runtime).
2. `'react/jsx-runtime'` singleton + `requiredVersion:false` ×3 shared — đúng theo pack; thiếu
   thì remote bundle jsx-runtime riêng (react thứ 2).
3. Shell dev proxy cần route kiểu mini-gateway (/api/tasks → node-svc, /api/auth → auth-mock)
   vì remote chạy trong page context của shell — dev-only, prod đi gateway (conventions/08).
4. Primitives TDD sẽ chạy vitest từ shell — cùng cơ chế resolve react nếu cần (xét khi RED).

**Verdict: PASS — JSX + hooks fe-shared qua MF boundary sạch duplicate-react. Primitives đi tiếp (không fallback class-only).**
