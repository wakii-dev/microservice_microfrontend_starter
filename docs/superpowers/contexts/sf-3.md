# SF-3 Context Pack — spring-svc (user API)
> Đọc file này THAY VÌ tự tổng hợp từ bracket + epic + comments.
> Epic spec: `docs/superpowers/specs/2026-10-12-boilerplate-microservice-mfe.md` (rev 3). Bracket: `docs/superpowers/mindmaps/micro-boilerplate.wakii`.

## Spec slice (chỉ phần SF-3 chịu trách nhiệm)
1. Scaffold `services/spring-svc/`: Spring Boot 3.x Web MVC (KHÔNG reactive), Java 21, **mvnw wrapper đi kèm** (dev machine có thể thiếu JDK — toolchain-in-Docker trong CI, native `mvnw` nếu JDK 21 có).
2. Codegen models từ `contracts/openapi/users.yaml` (maven plugin types only).
3. CRUD users + teams theo OpenAPI; service lắng nghe 8081; qua gateway `/api/users/*`.
4. **Seed migration đọc `contracts/auth/users.json`** (Flyway) — exit: users trong DB có id trùng khớp fixture 100% (assert trong test).
5. JWT enforcement: service TỰ verify signature + expiry (HS256 secret từ env) trên mọi route trừ healthcheck; sai/hết hạn → 401 TỪ SERVICE.
6. Postgres schema `users` + Flyway migration.
7. Healthcheck: actuator liveness + `/readyz` (ready khi DB pass).
8. Logback JSON shape theo conventions chung; error envelope chung.
9. CORS dev-profile.
10. Tests: @SpringBootTest + contract test theo OpenAPI.
11. Dockerfile multi-stage (mvnw trong builder stage).
12. **Boot-smoke CI job**: container up + healthz/readyz + Flyway chạy xong.
13. Compose entry PRE-SEED bởi SF-1 — KHÔNG sửa `platform/docker-compose.yml`.
14. README.md trong `services/spring-svc/` (chạy native/docker, env, API). Exit: docs đủ (copy-dir proof là SF-7).

## Touch map (files SF-3 tạo/sở hữu)
```
services/spring-svc/**           [SỞ HỮU]
platform/docker-compose.yml      [READ-ONLY — SF-1]
platform/conventions/*           [READ-ONLY]
contracts/openapi/users.yaml     [READ-ONLY — đổi = FLAG]
contracts/auth/users.json        [READ-ONLY — phải khớp]
.env.example                     [READ-ONLY]
```

## ACCEPTANCE (user-visible)
- Swagger spring-svc mở được; GET user fixture id trả đúng; CRUD teams hoạt động.
- Request thiếu token → 401 từ spring (không phải chỉ gateway); token giả/hết hạn → 401.
- CI xanh: tests + boot-smoke (up, health, Flyway xong, seed users khớp fixture).
- mvnw chạy được không cần JDK cài sẵn (wrapper tự tải) — hoặc CI toolchain-in-Docker.

## Boundary (KHÔNG làm)
- KHÔNG sửa compose/contracts/conventions (đụng = flag).
- KHÔNG implement node-svc/go-svc/FE.
- KHÔNG nối Keycloak thật — chỉ mock JWT theo token contract.
- KHÔNG thử docker local — CI verify.
