# 08 — Gateway routing table + MF remote registry

## Routing table (nginx — `platform/gateway/nginx/nginx.conf`)

| Path | Upstream | Auth presence check | Ghi chú |
|------|----------|--------------------|---------|
| `/api/tasks/*` | `node-svc:3001` | ✓ thiếu `Authorization` → 401 | pass-through, KHÔNG rewrite — service mount `/api/tasks` prefix |
| `/api/users/*` | `spring-svc:8081` | ✓ 401 | |
| `/api/activity/*` | `go-svc:8082` | ✓ 401 | |
| `/api/auth/*` | `auth-mock:8090` | ✗ mở | entry login + swagger UI `/api/auth/docs` |
| `/` | `shell:3000` | ✗ | MF host (SF-5) — 502 đến khi shell tồn tại |
| `/remotes/<name>/*` | remote `<name>` | ✗ | remote static (SF-6) — 502 đến khi tồn tại |

Quy tắc kỹ thuật:
1. **Pass-through**: `proxy_pass` không có URI part → original path giữ nguyên. OpenAPI `servers.url` = `/api/<svc>` khớp chính xác.
2. **Lazy DNS**: mọi upstream set qua biến + `resolver 127.0.0.11` (Docker DNS) — gateway KHÔNG crash-loop khi một upstream chưa tồn tại (SF-1 chỉ có postgres + auth-mock + gateway chạy được; shell/services vào sau).
3. Gateway sinh `X-Request-Id` nếu client thiếu (mirror vào response) — trace xuyên service, xem [03-logging.md](03-logging.md).
4. Gateway chỉ làm **presence check** JWT — KHÔNG verify signature (không giữ secret). Verify thật ở từng service, xem `contracts/auth/token-contract.md` §4.

## MF remote registry

Nguồn sự thật cho FE shell (SF-5) biết load remote nào ở đâu. Env-configurable — dev trỏ dev server, prod trỏ static qua gateway.

| Remote name | Module expose | Dev URL (env `REMOTE_TASKS_URL` / `REMOTE_ACTIVITY_URL`) | Prod URL |
|-------------|---------------|------------------|----------|
| `tasks` | `./TasksPage` | `http://localhost:4001/remoteEntry.js` | `/remotes/tasks/remoteEntry.js` (relative qua gateway) |
| `activity` | `./ActivityPage` | `http://localhost:4002/remoteEntry.js` | `/remotes/activity/remoteEntry.js` |

Quy tắc:
1. Shell đọc registry từ env (`REMOTE_TASKS_URL`, `REMOTE_ACTIVITY_URL`) lúc build/bootstrap — KHÔNG hardcode URL.
2. Remote name (`tasks`, `activity`) là khoá module federation — đổi tên = breaking, phải đồng bộ shell + remote + file này.
3. Shared singletons (react, react-dom): quản qua pnpm catalog — chi tiết trong `frontend/shared/package.json` (trường `mfToolkit.pinned`, kết quả spike SF-1).
4. **Singleton remote khai `requiredVersion: false` tường minh (SF-7 sync — học từ SF-6):** giá trị `catalog:` là literal pnpm-workspace, bundler MF không hiểu — `@module-federation/enhanced` infer thành `requiredVersion: "catalog:"` sai và match fail lúc runtime. Remote dùng shared singleton từ host phải khai `requiredVersion: false` trong share config (precedent: `frontend/remotes/{tasks,activity}/rspack.config.js`).
