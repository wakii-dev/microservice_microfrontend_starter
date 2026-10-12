# 05 — PORT TABLE (nguồn sự thật duy nhất)

Port cố định, giá trị dev = giá trị compose (override được qua `.env`, xem [06-configuration.md](06-configuration.md)). Không service nào tự chọn port khác.

## Bảng

| Thành phần | Port | Ghi chú |
|------------|------|---------|
| **nginx gateway** | **8080** | CỔNG DUY NHẤT browser/FE chạm vào |
| shell (MF host) | 3000 | dev server; compose static qua gateway `/` |
| remote `tasks` (FE) | 4001 | dev server; gateway `/remotes/tasks/` |
| remote `activity` (FE) | 4002 | dev server; gateway `/remotes/activity/` |
| node-svc | 3001 | Fastify + TS |
| spring-svc | 8081 | Spring Boot 3 |
| go-svc | 8082 | Go chi |
| auth-mock | 8090 | Fastify (Node) |
| postgres | 5432 | Postgres 16 |

## Env var tương ứng (khai trong `platform/.env.example`)

```
GATEWAY_PORT=8080
SHELL_PORT=3000
REMOTE_TASKS_PORT=4001
REMOTE_ACTIVITY_PORT=4002
NODE_SVC_PORT=3001
SPRING_SVC_PORT=8081
GO_SVC_PORT=8082
AUTH_MOCK_PORT=8090
POSTGRES_PORT=5432
```

## Quy tắc

1. Service **listen** theo env `PORT`/`SERVER_PORT` riêng của nó, default = bảng trên.
2. Inter-service call ĐI QUA TÊN COMPOSE (`http://node-svc:3001`), không qua gateway, không qua `localhost` — trong mạng docker `localhost` = container mình.
3. Native mode (không docker, dev local): gọi thẳng `http://localhost:<port>` — CORS rule xem [07-cors.md](07-cors.md).
4. Đổi port = sửa file này + `.env.example` + compose + README **trong cùng commit** (4 chỗ phải khớp).
