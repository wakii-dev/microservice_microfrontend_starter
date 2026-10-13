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
3. Compose `healthcheck` khai ở `platform/docker-compose.yml` probe **`/readyz`** (health-gated — SF-7). Ngoại lệ có chủ đích: **go-svc KHÔNG có healthcheck trong compose** — runtime distroless không có shell/wget, Dockerfile read-only với convergence (SF-7); readiness của go-svc được chứng minh bằng `scripts/smoke/e2e.sh` poll `/api/activity/stats` (compose `depends_on` go-svc ở mức `service_started`). Gateway cũng KHÔNG có healthcheck (nginx proxy thuần, không route `/readyz` — probe sẽ 404).
4. CI boot-smoke job: container up → curl `/healthz` → curl `/readyz` → cả hai 200 mới pass.
5. Path mounting: service mount **prefix `/api/<svc>`** cho business routes; `/healthz` + `/readyz` nằm **ngoài prefix** (naked path, ví dụ node-svc serve `/healthz` chứ không phải `/api/tasks/healthz`). Xem [08-gateway-and-remotes.md](08-gateway-and-remotes.md).
6. **Mirror rule (SF-7, học từ SF-4 — improvements-log finding schemathesis 404):** service expose `/healthz` + `/readyz` **cả hai dạng** — naked path (cho compose healthcheck + CI boot-smoke) VÀ mirror dưới prefix `/api/<svc>/healthz` + `/api/<svc>/readyz` (cho OpenAPI spec khai dưới `servers.url` + schemathesis contract test). Áp cho MỌI service mới; auth-mock là precedent. Service không expose mirror = contract test fail 404 khi chạy qua base-url có prefix.
