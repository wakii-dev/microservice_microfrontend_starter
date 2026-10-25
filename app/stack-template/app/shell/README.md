# app/shell — MF host (SF-5)

FE shell — Module Federation host (Rspack + `@module-federation/enhanced`), React 19 + TypeScript + pnpm. Cửa vào của demo: login mock JWT → nav → load remote `tasks` / `activity` (SF-6 impl) vào layout; remote down → error boundary fallback + retry, không trắng trang.

## Chạy native dev (không cần Docker)

```bash
# từ repo root — pnpm workspace
pnpm install
pnpm --filter @wakii/shell dev     # dev server :3000 (conventions/05)
```

Login demo: `alice@demo.local` / `demo-password` (fixture `contracts/auth/users.json` + dev password chung `AUTH_DEV_PASSWORD`).

Dev native cần auth-svc chạy ở `:8090`:

```bash
cd services/auth-svc && pnpm install --frozen-lockfile --ignore-workspace && pnpm dev
```

## Env (build-time — conventions/06 + 08)

| Env | Dev native | Prod (compose) | Ý nghĩa |
|-----|-----------|----------------|---------|
| `SHELL_PORT` | 3000 | (compose side) | port dev server |
| `API_BASE_URL` | `http://localhost:8090` (mặc định khi dev) | `''` (same-origin qua gateway) | base gọi API — dev gọi auth-svc trực tiếp (CORS dev mở, conventions/07), prod đi qua gateway |
| `REMOTE_TASKS_URL` | `http://localhost:4001/remoteEntry.js` | `/remotes/tasks/remoteEntry.js` (mặc định) | remoteEntry remote tasks |
| `REMOTE_ACTIVITY_URL` | `http://localhost:4002/remoteEntry.js` | `/remotes/activity/remoteEntry.js` (mặc định) | remoteEntry remote activity |

Ví dụ dev có remote SF-6 chạy local:

```bash
REMOTE_TASKS_URL=http://localhost:4001/remoteEntry.js pnpm --filter @wakii/shell dev
```

## Tests + build

```bash
pnpm --filter @wakii/shell test        # vitest + testing-library (48 tests / 9 file: a11y, login, remote-down, api-timeout, integration, primitives, shell-chrome)
pnpm --filter @wakii/shell typecheck
pnpm --filter @wakii/shell build       # rspack production build → dist/
```

A11y baseline CÓ TEST: skip link (`Tới nội dung chính`) + route focus management (focus `<main>` mỗi route change).

## Docker (verify qua CI — dev machine không có Docker)

```bash
# context = repo root (cần app/shared + workspace lockfile)
docker build -f app/shell/Dockerfile -t shell .
docker run -p 3000:3000 shell
```

Multi-stage: node:22-alpine build → nginx:1.27-alpine serve static `:3000`, SPA fallback, healthcheck.

## Pin matrix (không tự nâng — re-spike trước khi đổi)

`react`/`react-dom` 19.3.0 · `@rspack/core` 1.7.12 · `@module-federation/enhanced` 0.21.6 — single-source qua **pnpm catalog** (root `pnpm-workspace.yaml`, coordinator sở hữu). `@rspack/cli` pin 1.7.12 riêng (không có trong catalog).

## Standalone-copy

Copy thư mục này **KÈM `app/shared/`** (workspace dep `@wakii/fe-shared`) + root `pnpm-workspace.yaml` + `pnpm-lock.yaml`. Không copy = build fail ngay ở import fe-shared.

## Kiến trúc nhanh

- `src/index.tsx` → async boundary `import('./bootstrap')` (bắt buộc MF — tránh loadShareSync)
- `src/bootstrap.tsx` — import global `@wakii/ui-kit/styles/tokens.css` + `base.css` + `themes/dark.css` + `./app.css` (shell LÀM CHỦ global base — remotes KHÔNG import lại base khi chạy trong shell)
- `src/App.tsx` — routes `/`, `/tasks`, `/activity` (remote slots), `/login`
- `src/components/RemoteSlot.tsx` — lazy remote + error boundary + retry (Suspense fallback = Skeleton primitive)
- `src/api.ts` — ApiClient từ fe-shared, base `__API_BASE_URL__`
- Login dùng `tokenStorage` + `ApiClient` từ `@wakii/fe-shared` (READ-ONLY — SF-1 sở hữu)
- `src/app.css` — Tailwind v4 entry (import `@wakii/ui-kit/styles/tailwind.css`); shell style bằng Tailwind utilities + tokens CSS vars, không còn file css scoped riêng

## Design system (từ `@wakii/ui-kit` — ADR-0009)

- **Tokens**: `import '@wakii/ui-kit/styles/tokens.css'` — CSS vars `--c-*` (canvas `#f5f5f5`, khối trắng `#ffffff` — bậc bề mặt antd), `--ink*`, `--line*`, `--accent*` (`#1677ff` antd colorPrimary), `--st-*`, `--sp-*`, `--fs-*`, `--r-*` + motion/ease scale; shadow layered cho floating surfaces (`--shadow-pop/lift`, `--ele-1..3`).
- **Base**: `import '@wakii/ui-kit/styles/base.css'` — reset mỏng + element defaults (`@layer reset,base`) — CHỈ shell import làm global.
- **Primitives**: `import { Badge, Button, Table, … } from '@wakii/ui-kit'` — 90+ components (xem barrel `app/ui-kit/src/index.ts`) + hooks/utils/motion; catalog sống ở Storybook (`pnpm --filter @wakii/ui-kit storybook`). `Badge variant: todo|doing|done|failed|created|updated|assigned|deleted|assignmentFailed` (role="status").
- Hướng visual: light antd-look mặc định (spec `docs/superpowers/specs/2026-10-17-antd-look-tokens.md`); dark là theme phụ qua `UiKitProvider` (`data-bp-theme` → `@wakii/ui-kit/styles/themes/dark.css`).
