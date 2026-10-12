# @boilerplate/remote-activity

FE remote `activity` — MF REMOTE (Rspack + @module-federation/enhanced, React 19). Expose `./ActivityPage`, shell (MF host) mount vào route `/activity` theo remote registry [`platform/conventions/08-gateway-and-remotes.md`](../../../platform/conventions/08-gateway-and-remotes.md).

Feed + stats qua gateway `/api/activity` (go-svc) — render **trực tiếp** user-display fields (`userName`, `taskTitle`) từ response (go-svc resolve, FE không tự bịa); JWT tự đính qua `@boilerplate/fe-shared` ApiClient; error envelope decode → banner (stats lỗi không che feed).

## Chạy dev

```bash
# từ repo root — pnpm workspace
pnpm install
pnpm --filter @boilerplate/remote-activity dev   # http://localhost:4002
```

Remote thật sự dùng được khi load TRONG shell (`pnpm --filter @boilerplate/shell dev` với
`REMOTE_ACTIVITY_URL=http://localhost:4002/remoteEntry.js`); standalone :4002 chỉ để debug UI
(không token ở origin này → API 401 là đúng hành vi).

## Env build-time (conventions/06)

| Var | Default dev | Prod | Ý nghĩa |
|-----|-------------|------|---------|
| `API_BASE_URL` | `http://localhost:8082` | `''` | Base gọi API — dev native gọi thẳng go-svc (CORS dev mở, conventions/07); prod same-origin qua gateway |
| `REMOTE_PUBLIC_PATH` | `http://localhost:4002/` | `/remotes/activity/` | publicPath chunk (absolute khi dev, relative qua gateway khi prod) |
| `REMOTE_ACTIVITY_PORT` | `4002` | — | Port dev server (conventions/05) |

## Test + build

```bash
pnpm --filter @boilerplate/remote-activity test        # vitest + testing-library
pnpm --filter @boilerplate/remote-activity typecheck
pnpm --filter @boilerplate/remote-activity build       # dist/ — Dockerfile nginx serve static
```

## Docker

Build context = **repo root** (cần `frontend/shared` + lockfile):

```bash
docker build -f frontend/remotes/activity/Dockerfile -t boilerplate-remote-activity .
docker run -p 4002:4002 boilerplate-remote-activity   # http://localhost:4002/remoteEntry.js
```

## Standalone-copy

Copy thư mục này **KÈM `frontend/shared/`** (+ root `pnpm-workspace.yaml`/`pnpm-lock.yaml`) — remote import `@boilerplate/fe-shared` qua `workspace:*`.

## API contract

`contracts/openapi/activity.yaml` — source of truth (feed/stats shape, user-display fields, error envelope).

> Lưu ý: override `REMOTE_ACTIVITY_PORT` KHÔNG tự đổi publicPath (default vẫn :4002) — đặt kèm `REMOTE_PUBLIC_PATH` nếu đổi port dev.
