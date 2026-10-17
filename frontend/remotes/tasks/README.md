# @boilerplate/remote-tasks

FE remote `tasks` — MF REMOTE (Rspack + @module-federation/enhanced, React 19). Expose `./TasksPage`, shell (MF host) mount vào route `/tasks` theo remote registry [`platform/conventions/08-gateway-and-remotes.md`](../../../platform/conventions/08-gateway-and-remotes.md).

CRUD task qua gateway `/api/tasks` (node-svc) — danh sách + tạo + sửa status; JWT tự đính qua `@boilerplate/fe-shared` ApiClient; error envelope decode → inline banner.

## Chạy dev

```bash
# từ repo root — pnpm workspace
pnpm install
pnpm --filter @boilerplate/remote-tasks dev   # http://localhost:4001
```

Remote thật sự dùng được khi load TRONG shell (`pnpm --filter @boilerplate/shell dev` với
`REMOTE_TASKS_URL=http://localhost:4001/remoteEntry.js`); standalone :4001 chỉ để debug UI
(không token ở origin này → API 401 là đúng hành vi).

## Env build-time (conventions/06)

| Var | Default dev | Prod | Ý nghĩa |
|-----|-------------|------|---------|
| `API_BASE_URL` | `http://localhost:3001` | `''` | Base gọi API — dev native gọi thẳng node-svc (CORS dev mở, conventions/07); prod same-origin qua gateway |
| `REMOTE_PUBLIC_PATH` | `http://localhost:4001/` | `/remotes/tasks/` | publicPath chunk (absolute khi dev, relative qua gateway khi prod) |
| `REMOTE_TASKS_PORT` | `4001` | — | Port dev server (conventions/05) |

## Test + build

```bash
pnpm --filter @boilerplate/remote-tasks test        # vitest + testing-library
pnpm --filter @boilerplate/remote-tasks typecheck
pnpm --filter @boilerplate/remote-tasks build       # dist/ — Dockerfile nginx serve static
```

## Docker

Build context = **repo root** (cần `frontend/shared` + lockfile):

```bash
docker build -f frontend/remotes/tasks/Dockerfile -t boilerplate-remote-tasks .
docker run -p 4001:4001 boilerplate-remote-tasks   # http://localhost:4001/remoteEntry.js
```

## Standalone-copy

Copy thư mục này **KÈM `frontend/shared/`** (+ root `pnpm-workspace.yaml`/`pnpm-lock.yaml`) — remote import `@boilerplate/fe-shared` qua `workspace:*`.

## API contract

`contracts/openapi/tasks.yaml` — source of truth (list/create/patch shape, error envelope, status enum `todo|in_progress|done`).

> Lưu ý: override `REMOTE_TASKS_PORT` KHÔNG tự đổi publicPath (default vẫn :4001) — đặt kèm `REMOTE_PUBLIC_PATH` nếu đổi port dev.

## Design system (từ `@boilerplate/fe-shared` — story VU-53)

- **Trong shell**: KHÔNG import lại `base.css` — shell import global làm chủ; remote chỉ ăn **tokens** CSS vars (`--c-* --ink* --line* --accent* --st-* --sp-* --fs-* --r-*`) + scoped classes riêng (`tsk-*`), không element selector toàn cục.
- **Standalone** (`src/standalone.tsx`): tự import `tokens.css` + `base.css` để trang debug có style đầy đủ.
- **Primitives**: `import { Badge, EmptyState, Skeleton, Spinner } from '@boilerplate/fe-shared'` — StatusBadge bọc `Badge variant todo|doing|done|failed` (badge "Gán thất bại" = `failed`, role="status"); list skeleton = `Skeleton variant="row"`; empty = `EmptyState`; per-item busy = `Spinner`.
- Hướng visual: `docs/superpowers/designs/ui-redesign-direction.md` (hướng B "Linear-referenced dark").
