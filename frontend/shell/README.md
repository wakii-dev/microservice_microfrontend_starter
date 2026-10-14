# frontend/shell — MF host (SF-5)

FE shell — Module Federation host (Rspack + `@module-federation/enhanced`), React 19 + TypeScript + pnpm. Cửa vào của demo: login mock JWT → nav → load remote `tasks` / `activity` (SF-6 impl) vào layout; remote down → error boundary fallback + retry, không trắng trang.

## Chạy native dev (không cần Docker)

```bash
# từ repo root — pnpm workspace
pnpm install
pnpm --filter @boilerplate/shell dev     # dev server :3000 (conventions/05)
```

Login demo: `alice@demo.local` / `demo-password` (fixture `contracts/auth/users.json` + dev password chung `AUTH_MOCK_DEV_PASSWORD`).

Dev native cần auth-mock chạy ở `:8090`:

```bash
cd platform/auth-mock && pnpm install && pnpm dev   # hoặc node src/server.js
```

## Env (build-time — conventions/06 + 08)

| Env | Dev native | Prod (compose) | Ý nghĩa |
|-----|-----------|----------------|---------|
| `SHELL_PORT` | 3000 | (compose side) | port dev server |
| `API_BASE_URL` | `http://localhost:8090` (mặc định khi dev) | `''` (same-origin qua gateway) | base gọi API — dev gọi auth-mock trực tiếp (CORS dev mở, conventions/07), prod đi qua gateway |
| `REMOTE_TASKS_URL` | `http://localhost:4001/remoteEntry.js` | `/remotes/tasks/remoteEntry.js` (mặc định) | remoteEntry remote tasks |
| `REMOTE_ACTIVITY_URL` | `http://localhost:4002/remoteEntry.js` | `/remotes/activity/remoteEntry.js` (mặc định) | remoteEntry remote activity |

Ví dụ dev có remote SF-6 chạy local:

```bash
REMOTE_TASKS_URL=http://localhost:4001/remoteEntry.js pnpm --filter @boilerplate/shell dev
```

## Tests + build

```bash
pnpm --filter @boilerplate/shell test        # vitest + testing-library (38 tests: a11y, login, remote-down, api-timeout, integration, primitives, shell-chrome)
pnpm --filter @boilerplate/shell typecheck
pnpm --filter @boilerplate/shell build       # rspack production build → dist/
```

A11y baseline CÓ TEST: skip link (`Tới nội dung chính`) + route focus management (focus `<main>` mỗi route change).

## Docker (verify qua CI — dev machine không có Docker)

```bash
# context = repo root (cần frontend/shared + workspace lockfile)
docker build -f frontend/shell/Dockerfile -t shell .
docker run -p 3000:3000 shell
```

Multi-stage: node:22-alpine build → nginx:1.27-alpine serve static `:3000`, SPA fallback, healthcheck.

## Pin matrix (không tự nâng — re-spike trước khi đổi)

`react`/`react-dom` 19.3.0 · `@rspack/core` 1.7.12 · `@module-federation/enhanced` 0.21.6 — single-source qua **pnpm catalog** (root `pnpm-workspace.yaml`, coordinator sở hữu). `@rspack/cli` pin 1.7.12 riêng (không có trong catalog).

## Standalone-copy

Copy thư mục này **KÈM `frontend/shared/`** (workspace dep `@boilerplate/fe-shared`) + root `pnpm-workspace.yaml` + `pnpm-lock.yaml`. Không copy = build fail ngay ở import fe-shared.

## Kiến trúc nhanh

- `src/index.tsx` → async boundary `import('./bootstrap')` (bắt buộc MF — tránh loadShareSync)
- `src/bootstrap.tsx` — import global `@boilerplate/fe-shared/styles/tokens.css` + `base.css` (shell LÀM CHỦ global base — remotes KHÔNG import lại base khi chạy trong shell)
- `src/App.tsx` — routes `/`, `/tasks`, `/activity` (remote slots), `/login`
- `src/components/RemoteSlot.tsx` — lazy remote + error boundary + retry (Suspense fallback = Skeleton primitive)
- `src/api.ts` — ApiClient từ fe-shared, base `__API_BASE_URL__`
- Login dùng `tokenStorage` + `ApiClient` từ `@boilerplate/fe-shared` (READ-ONLY — SF-1 sở hữu)
- `src/styles.css` — scoped classes shell (`sh-*`), chỉ ăn tokens CSS vars từ fe-shared

## Design system (từ `@boilerplate/fe-shared` — story VU-53)

- **Tokens**: `import '@boilerplate/fe-shared/styles/tokens.css'` — CSS vars `--c-*` (surface ladder `#010102→#18191a`), `--ink*`, `--line*`, `--accent*`, `--st-*`, `--sp-*`, `--fs-*`, `--r-*`. Depth = surface + viền 1px, KHÔNG box-shadow.
- **Base**: `import '@boilerplate/fe-shared/styles/base.css'` — reset mỏng + element defaults (`@layer reset,base`) — CHỈ shell import làm global.
- **Primitives**: `import { Badge, EmptyState, Skeleton, Spinner } from '@boilerplate/fe-shared'` — `Badge variant: todo|doing|done|failed|created|updated|assigned|deleted|assignmentFailed` (role="status"), Skeleton (aria-busy + prefers-reduced-motion), Spinner (label bắt buộc), EmptyState (title/description/action).
- Hướng visual: `docs/superpowers/designs/ui-redesign-direction.md` (hướng B, user đã duyệt).
