# 07 — CORS dev-profile rule

## Quy tắc cốt lõi

**Prod (qua gateway): KHÔNG cần CORS** — browser chỉ nói chuyện với một origin (gateway :8080); FE không bao giờ gọi service port trực tiếp.

**Dev native (không docker): CÓ CORS** — FE dev server :3000/:4001/:4002 gọi thẳng `localhost:3001/8081/8082/8090` → mở CORS cho đúng các origin dev, không mở đại `*` kèm credentials.

## Cụ thể

| Service | Mechanism | Scope |
|---------|-----------|-------|
| node-svc | `@fastify/cors` | origin = `CORS_DEV_ORIGIN` (env, ví dụ `http://localhost:3000,http://localhost:4001,http://localhost:4002`); methods GET/POST/PATCH/DELETE; headers `Authorization, Content-Type, X-Request-Id` |
| spring-svc | `WebMvcConfigurer#addCorsMappings`, bean chỉ active với profile `dev` (`@Profile("dev")`) | cùng scope ở trên, đọc `cors.dev-origins` từ env |
| go-svc | middleware `github.com/rs/cors` | cùng scope, đọc `CORS_DEV_ORIGIN` |
| auth-svc | `@fastify/cors` | mở cho dev origin (FE dev gọi trực tiếp :8090) |

## Quy tắc

1. Origin KHÔNG hardcode — đọc `CORS_DEV_ORIGIN` (danh sách phân tách phẩy).
2. Không bao giờ `origin: *` kết hợp `credentials: true`.
3. Prod profile (compose): CORS middleware vẫn mount nhưng origin list rỗng → không header ACAO nào được emit (deny-by-default).
4. Native FE dev mà thiếu CORS → lỗi network ngay trong console — check env trước khi debug service.
