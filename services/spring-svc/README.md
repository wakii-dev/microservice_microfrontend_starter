# spring-svc — user API (Spring Boot 3)

Source-of-truth **users + teams** của boilerplate (SF-3, Linear FI-71). Spring Boot 3.5 Web MVC (không
reactive), Java 21, Flyway (schema `users`), JWT HS256 **service-side verify**, port **8081** (conventions/05).

## Contracts (source of truth — KHÔNG sửa trong thư mục này)

| Contract | Dùng để |
|---|---|
| `contracts/openapi/users.yaml` | API surface + codegen models (maven plugin) |
| `contracts/auth/users.json` | Seed migration (V2) đọc qua env `USERS_FIXTURE_PATH` |
| `contracts/auth/token-contract.md` | JWT verify (HS256, TTL 8h, iss `auth-mock`) |
| `platform/conventions/*` | port, healthcheck, log JSON, error envelope, CORS, Dockerfile pattern |

## API — FINAL paths (contract-resolved: `servers.url /api/users` + path)

| Method | Path | Ghi chú |
|---|---|---|
| GET | `/api/users/users?limit&offset` | list, limit ∈ [1,100] default 50 |
| POST | `/api/users/users` | 201; thiếu `roles` → default `["user"]`; email trùng → 409 |
| GET | `/api/users/users/{userId}` | endpoint node-svc dùng validate assignee |
| PATCH | `/api/users/users/{userId}` | displayName/roles; body rỗng → 400 |
| GET | `/api/users/teams` · POST | POST dedupe `memberIds` |
| GET | `/api/users/teams/{teamId}` | kèm memberIds |
| GET | `/healthz` · `/readyz` | naked, không-auth; ready = Flyway xong + DB pass; 503 → envelope `DEPENDENCY_DOWN` |
| GET | `/actuator/health/liveness` | actuator probes |

⚠️ `/api/teams` **không tồn tại** — gateway chỉ route `/api/users/*`; mọi consumer dùng bảng trên.
Swagger UI (host port 8081, KHÔNG qua gateway): `http://localhost:8081/swagger-ui/index.html`.

## Chạy (dev machine không Docker/JDK → toolchain-in-Docker trong CI là đường chính)

**CI (GitHub Actions)** — `.github/workflows/services-spring-svc.yml`: build-test (`mvnw verify` trên
Postgres service container thật, init script SF-1 mount đầy đủ), docker-build, boot-smoke (compose up →
login auth-mock → GET fixture user → 401-from-service checks), drift-guard snapshot.

**Native (máy có JDK 21):**
```bash
cd services/spring-svc
JWT_SECRET=$(openssl rand -base64 48) \
USERS_FIXTURE_PATH=../../contracts/auth/users.json \
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/boilerplate \
SPRING_DATASOURCE_USERNAME=spring_svc SPRING_DATASOURCE_PASSWORD=... \
./mvnw spring-boot:run
```
CORS dev-native: thêm `-Dspring.profiles.active=dev` + env `CORS_DEV_ORIGIN=http://localhost:3000,...`.

**Docker (máy có Docker):** `docker compose -f platform/docker-compose.yml up --build spring-svc` —
entry đã pre-seed bởi SF-1 (SF-3 KHÔNG sửa compose).

## Env vars (fail-fast khi thiếu bắt buộc)

| Env | Bắt buộc | Ý nghĩa |
|---|---|---|
| `JWT_SECRET` | ✓ | HS256 secret (UTF-8 bytes) — khớp auth-mock; thiếu = fail boot |
| `USERS_FIXTURE_PATH` | ✓ | Đường dẫn `contracts/auth/users.json` (compose mount `/app/contracts/auth/users.json`) |
| `SPRING_DATASOURCE_URL/USERNAME/PASSWORD` | ✓ | Role `spring_svc` (search_path=users do init script SF-1 set) |
| `SERVER_PORT` | — | default 8081 |
| `CORS_DEV_ORIGIN` | — | comma list; chỉ có tác dụng với profile `dev` |
| `LOG_LEVEL` | — | default `info` |

## ADR (ghi ngắn tại chỗ — tổng hợp đầy đủ ở SF-7)

1. **JWT: jjwt + servlet filter tự viết** thay spring-security-oauth2-resource-server — mock 1 secret
   HS256, kiểm soát 401 envelope conventions/04; điểm cắm OIDC: đổi filter sang JWKS/RS256, claims giữ nguyên.
2. **Snapshot `src/main/resources/openapi/users.yaml` là BIT-IDENTICAL của `contracts/openapi/users.yaml`**
   — KHÔNG sửa file này; Docker build context = `services/spring-svc` không thấy `contracts/`. Sync = copy
   lại từ contracts; CI drift-guard (`diff`) chặn lệch. Provenance: commit đầu T1 (FI-71).
3. **Seed = Flyway Java migration (V2) đọc file fixture thật** — không hardcode SQL id → khớp fixture theo
   cấu trúc. **Fixture evolution**: thêm user mới sau khi V2 đã applied = viết **V3 migration** đọc fixture
   và insert phần tăng (V2 chỉ chạy 1 lần — Flyway versioning).
4. **healthz/readyz mirror dưới `/api/users/*`** (generated interface) là pattern conventions/02 như
   auth-mock — probe thật dùng naked `/healthz` `/readyz`.
5. **Email uniqueness case-sensitive** (DB UNIQUE) — auth-mock login lowercase là đủ demo; dự án thật
   cắm OIDC sẽ bỏ match-by-email.
6. **Codegen `interfaceOnly`** — supersét của "types only" trong context pack: models + API interface,
   controllers implement interface → compile-error nếu lệch contract (contract-sync compile-time).

## Tests

`mvnw verify` — @SpringBootTest trên **Postgres thật** (CI service container, KHÔNG H2):
seed-id-match 100% (đọc cùng `contracts/auth/users.json`), JWT filter 6 case, users/teams API,
health shape, log shape conventions/03, CORS dev/default. CRUD tests `@Transactional` (rollback) —
seed test độc lập.
