# 02 — Healthcheck: `/healthz` + `/readyz`

Mọi HTTP service expose 2 endpoint không-auth (gateway không chặn, service không verify JWT trên 2 path này):

| Endpoint | Ý nghĩa | Trả về khi ổn | Trả về khi chưa ổn |
|----------|---------|---------------|--------------------|
| `/healthz` | **Liveness** — process sống | `200 {"status":"ok"}` | process chết → không response |
| `/readyz` | **Readiness** — nhận traffic được (deps xong) | `200 {"status":"ok"}` | `503` error envelope |

## Điều kiện ready per service

| Service | `/readyz` = 200 khi |
|---------|---------------------|
| node-svc | DB migration chạy xong + spring-svc reachable (kiểm lúc boot, không ping liên tục) |
| spring-svc | Flyway migration xong + DataSource healthy |
| go-svc | Migration schema `activity` xong + SELECT thử được schema `tasks` (readonly role) |
| auth-mock | users fixture load xong |

## Quy tắc

1. Body JSON: `{"status":"ok"}` — không thêm trường (CI boot-smoke grep đúng shape này).
2. `/readyz` phải kiểm tra **thật** (query DB thật), không hardcode 200.
3. Compose `healthcheck` khai ở `platform/docker-compose.yml` dùng `/healthz` (liveness) — SF-7 upgrade thành health-gated `/readyz`.
4. CI boot-smoke job: container up → curl `/healthz` → curl `/readyz` → cả hai 200 mới pass.
5. Path mounting: service mount **prefix `/api/<svc>`** cho business routes; `/healthz` + `/readyz` nằm **ngoài prefix** (naked path, ví dụ node-svc serve `/healthz` chứ không phải `/api/tasks/healthz`) — trừ auth-mock expose cả hai dạng (naked + `/api/auth/*` mirror) vì gateway chỉ route `/api/auth`. Xem [08-gateway-and-remotes.md](08-gateway-and-remotes.md).
