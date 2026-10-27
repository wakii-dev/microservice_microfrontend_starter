# 08 — Gateway routing table + MF remote registry

## Routing table (nginx — `platform/gateway/nginx/nginx.conf`)

| Path | Upstream | Auth presence check | Ghi chú |
|------|----------|--------------------|---------|
| `/api/tasks/*` | `node-svc:3001` | ✓ thiếu `Authorization` → 401 | pass-through, KHÔNG rewrite — service mount `/api/tasks` prefix |
| `/api/users/*` | `spring-svc:8081` | ✓ 401 | |
| `/api/activity/*` | `go-svc:8082` | ✓ 401 | |
| `/api/dotnet/*` | `dotnet-svc:8083` | ✓ 401 | notifications (ADR-0011) |
| `/api/auth/*` | `auth-svc:8090` | ✗ mở | entry login + register + refresh (auth.yaml v2) |
| `/` | `shell:3000` | ✗ | MF host (SF-5) — 502 đến khi shell tồn tại |
| `/remotes/<name>/*` | remote `<name>` | ✗ | remote static (SF-6) — 502 đến khi tồn tại |

Quy tắc kỹ thuật:
1. **Pass-through**: `proxy_pass` không có URI part → original path giữ nguyên. OpenAPI `servers.url` = `/api/<svc>` khớp chính xác.
2. **Lazy DNS**: mọi upstream set qua biến + `resolver 127.0.0.11` (Docker DNS) — gateway KHÔNG crash-loop khi một upstream chưa tồn tại (stage đầu chỉ có postgres + auth-svc + gateway chạy được; shell/services vào sau).
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
3. Shared singletons (react, react-dom): quản qua pnpm catalog — chi tiết trong `app/shared/package.json` (trường `mfToolkit.pinned`, kết quả spike SF-1).
4. **Singleton remote khai `requiredVersion: false` tường minh (SF-7 sync — học từ SF-6):** giá trị `catalog:` là literal pnpm-workspace, bundler MF không hiểu — `@module-federation/enhanced` infer thành `requiredVersion: "catalog:"` sai và match fail lúc runtime. Remote dùng shared singleton từ host phải khai `requiredVersion: false` trong share config (precedent: `app/remotes/{tasks,activity}/rspack.config.js`).

## Gateway Traefik (tùy chọn — parity với nginx, spike nghiệm chứng 2026-10-27)

`platform/gateway-traefik/` là **lựa chọn gateway thay thế nginx** chạy overlay
song song (không sửa compose chính) — parity đã kiểm 8/8: 3 API protected trả
401 envelope giống hệt, `/api/auth` mở, `/remotes/*` strip prefix, `/` → shell.

| Khía cạnh | nginx (mặc định) | Traefik (opt-in) |
|---|---|---|
| Cấu hình | 150 dòng conf + `resolver` hack (Docker DNS lazy) + `map $uri` (nguy cơ lazy-eval bug — đã dính 2026-10-13) | ~85 dòng YAML khai báo routers/middlewares/services, resolve runtime mặc định |
| Bật | có sẵn :8080 | `cd platform/gateway-traefik && docker compose -f docker-compose.traefik.yml up -d` → **:8088** |
| JWT presence | `if ($http_authorization = "")` inline | middleware `forwardAuth` → `auth-presence` (tách service — đường nâng cấp: trỏ `address` về `auth-svc` verify để **revoke token tại cửa**) |
| Dashboard | không | `:8088/dashboard/` |
| Còn thiếu | — | echo `X-Request-Id` cần plugin/service (builtin không có) |

Quy tắc khi thêm remote/service mới với Traefik: thêm 1 router + 1 service +
middleware strip (nếu `/remotes/*`) trong `traefik-dynamic.yml` — KHÔNG map
$uri kiểu nginx. Nginx vẫn là mặc định của stack-template; đổi mặc định chỉ
khi toàn stack smoke (`scripts/smoke/e2e.sh`) chạy trên Traefik xanh.
