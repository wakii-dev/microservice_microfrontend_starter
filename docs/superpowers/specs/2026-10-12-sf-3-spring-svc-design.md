# Spec — SF-3 spring-svc — user API (Spring Boot 3) (FI-71)

> Story FI-62 · epic spec rev 3 · slice: `docs/superpowers/contexts/sf-3.md` · impact: `docs/superpowers/plans/2026-10-12-sf-3-spring-svc-impact.md`
> Status: Approved — brainstorm autonomous (brief FI-62: decisions đã chốt ở epic, KHÔNG hỏi lại; SF slice của spec rev 3 đã qua spec-critic + plan-critic 2 vòng ở epic level).

## 0. Root cause / strategy

Không có service nào sở hữu users/teams → node-svc không validate được assignee (acceptance #2 gãy),
JWT service-side enforcement (acceptance #4) chưa chứng minh. Chiến lược: **contract-first slice** —
impl đúng `contracts/openapi/users.yaml`, seed đọc file fixture thật, verify bằng CI (không Docker/JDK local).

## 1. Problem

spring-svc = source-of-truth users/teams cho toàn hệ thống. Auth-mock cấp JWT với `sub` = id fixture;
mọi consumer tin rằng id đó tồn tại trong DB của spring-svc. Thiếu spring-svc → 2 acceptance gãy.

## 2. Scope

**In**: scaffold Spring Boot 3 Web MVC + mvnw; codegen models (maven plugin, types); CRUD users + teams
đúng contract; Flyway (DDL + seed Java migration đọc `USERS_FIXTURE_PATH`); JWT HS256 service-side verify;
healthz/readyz + actuator liveness; logback JSON; error envelope; CORS dev-profile; tests
(@SpringBootTest trên Postgres thật trong CI + seed-id-match assert); Dockerfile multi-stage;
CI workflow (build-test + docker-build + boot-smoke + drift-guard); README; snapshot `users.yaml` trong build context.

**Out**: node-svc/go-svc/FE; Keycloak; compose/conventions/contracts edits; DELETE endpoints (contract không có);
copy-dir proof (SF-7); scaffold script.

**Success criteria (CI-verifiable)**:
1. CI `services-spring-svc` xanh: build-test (mvnw verify trên Postgres service container), docker-build, boot-smoke (up + healthz/readyz 200 `{"status":"ok"}` + login auth-mock → GET fixture user 200 + no-token/garbage-token → 401 TỪ SERVICE direct :8081).
2. Seed-id-match test: DB ids == fixture ids 100% (assert trong test, đọc cùng file contracts/auth/users.json).
3. Swagger UI mở được qua host port 8081 (`/swagger-ui/index.html`); api-docs JSON chứa đúng FINAL path
   table §4.5 (`/api/users/users`, `/api/users/teams`, …) — chứng minh mount khớp contract.
4. mvnw wrapper hoạt động trong CI Linux (toolchain path chính); README ghi rõ.

## 3. Touch map

Xem impact doc mục 2. Sở hữu: `services/spring-svc/**`, `.github/workflows/services-spring-svc.yml`,
`docs/superpowers/evidence/sf-3/**`, snapshot `services/spring-svc/src/main/resources/openapi/users.yaml`.

## 4. Design

### 4.1 Stack & layout
- Spring Boot **3.5.x** (Web MVC, không reactive), **Java 21**, Maven wrapper 3.3.x (script-only, tự tải).
- Package: `com.example.springsvc` (template-neutral, copy-able).
- Deps: web, data-jpa, validation, actuator, flyway (+flyway-database-postgresql), postgresql (runtime),
  jjwt 0.12.x (api/impl/jackson), logstash-logback-encoder, springdoc-openapi 2.8.x, openapi-generator-maven-plugin.
- Tên bảng/cột snake_case khớp DDL tự viết (Hibernate `ddl-auto: none` — Flyway là schema owner).

### 4.2 Codegen + snapshot drift-guard
Docker context = `services/spring-svc` (compose `build: ../services/spring-svc`) — không thấy `contracts/`.
→ commit **snapshot BIT-IDENTICAL** `src/main/resources/openapi/users.yaml` — KHÔNG thêm comment/header
trong file YAML (thêm = drift-guard fail ngay run đầu); provenance + quy tắc sync ghi ở README.md.
Plugin: generatorName `spring`, `interfaceOnly=true, skipDefaultInterface=true, useSpringBoot3=true,
useTags=true, openApiNullable=false, useBeanValidation=true` → models (`api.model`) + API interfaces (`api`)
— controllers implement interface → compile-error nếu lệch contract signature. (ADR 1 dòng: slice viết
"types only" — interfaceOnly là supersét, models + interface mapping, giữ contract-sync compile-time;
base-path mặc định `${openapi.usersAPI.base-path:/api/users}` verify lúc task 1 context-load.)

### 4.3 Schema & seed
```sql
-- V1__init.sql (schema users qua role search_path — init script SF-1 đã SET search_path = users)
CREATE TABLE users (id uuid PRIMARY KEY, email varchar(255) NOT NULL UNIQUE,
                    display_name varchar(255) NOT NULL, roles text[] NOT NULL);
CREATE TABLE teams (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name varchar(255) NOT NULL);
CREATE TABLE team_members (team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
                           user_id uuid NOT NULL, PRIMARY KEY (team_id, user_id));
```
- **V2__SeedUsers.java** (Flyway `BaseJavaMigration`): đọc env `USERS_FIXTURE_PATH` (compose mount
  `/app/contracts/auth/users.json`; native `../../contracts/auth/users.json`), parse Jackson với
  `FAIL_ON_UNKNOWN_PROPERTIES=false` (fixture có key `$comment`), insert
  qua JDBC (`createArrayOf("text")` cho roles). Thiếu/sai file → fail migration → fail boot (fail-fast, conventions/06).
  Fixture evolution: thêm user vào fixture SAU khi V2 đã applied → V3 migration riêng (README ADR ghi quy trình).
- Compose entry đã inject mọi env cần (verified) — KHÔNG sửa compose.

### 4.4 JWT enforcement (lớp 2 — token-contract §4)
- `JwtVerifier`: jjwt — HS256, `SecretKeySpec(JWT_SECRET UTF-8 bytes)` (khớp node `jsonwebtoken`),
  tự check `exp`, `requireIssuer("auth-mock")`. `JWT_SECRET` thiếu → fail-fast lúc boot.
- `JwtAuthFilter` (OncePerRequestFilter): mọi route TRỪ `/healthz`, `/readyz`, `/actuator/**`,
  `/v3/api-docs/**`, `/swagger-ui/**`, VÀ mọi `OPTIONS` preflight (preflight không mang Authorization —
  chặn = CORS native gãy hoàn toàn; có test). Business data không lộ qua swagger docs (chỉ schema tài
  liệu; auth-mock precedent).
  Fail bất kỳ (missing/bad-format/bad-sig/expired/wrong-iss) → **401 envelope** `{error:{code:"UNAUTHORIZED",
  message, requestId}}` — 401 TỪ SERVICE, không tin gateway.
- ADR (README): filter tự viết thay spring-security resource server — mock 1 secret HS256, điểm cắm OIDC
  = đổi filter sang JWKS/RS256, claims giữ nguyên.

### 4.5 API surface — FINAL PATH TABLE (P0 fix spec-critic: OpenAPI servers.url + path = full path)
Contract-resolved (khớp gateway pass-through `/api/users/*` + codegen base-path default `/api/users`):

| Method | FINAL path (mounted) | Ghi chú |
|--------|---------------------|---------|
| GET/POST | `/api/users/users` | list (limit/offset) / create |
| GET/PATCH | `/api/users/users/{userId}` | get / update |
| GET/POST | `/api/users/teams` | list / create |
| GET | `/api/users/teams/{teamId}` | kèm memberIds |
| GET | `/healthz`, `/readyz` | **naked, hand-written** (conventions/02) — generated `getHealthz/getReadyz` mirror cùng handler (qua gateway sẽ 401 khi thiếu token — bình thường, probe dùng naked) |

- ⚠️ `/api/teams` (spec-literal) KHÔNG tồn tại: gateway không route → mọi consumer đi đúng contract path trên.
- Users behavior: POST thiếu `roles` → default `["user"]` server-side (contract default — codegen không apply
  khi deserialize; test case riêng); PATCH minProperties 1 → 400 nếu body rỗng; `limit` ngoài [1,100] → 400
  (`@Validated` method-validation); POST teams `memberIds` dedupe trước insert (tránh PK violation 500);
  email uniqueness case-sensitive (DB UNIQUE — ghi README; auth-mock login lowercase là đủ demo).
- Error envelope (conventions/04) qua `@RestControllerAdvice`: 400 VALIDATION_ERROR / 401 UNAUTHORIZED /
  404 NOT_FOUND / 409 CONFLICT / 500 INTERNAL (không lộ stack); echo `X-Request-Id` vào `requestId` + MDC log.

### 4.6 Health & logging & CORS
- `/healthz` → `{"status":"ok"}` (shape CỐ ĐỊNH — CI grep); `/readyz` → thật: query `SELECT 1` trên
  DataSource + Flyway applied, fail → 503 envelope; actuator liveness `/actuator/health/liveness` (probes enabled).
- Logback: `LogstashEncoder` fieldNames `timestamp=ts, message=msg`, customFields `service=spring-svc`,
  MDC `requestId`; `LOG_LEVEL` env → `logging.level.root` (relaxed binding). **Level lowercase** —
  LogstashEncoder mặc định emit `INFO` uppercase, conventions/03 bắt buộc `info`: custom
  `LowercaseLevelJsonProvider` (provider class tự viết ~10 dòng, đăng ký trong logback-spring.xml).
  Không log token; email mask.
- CORS: `WebMvcConfigurer` bean `@Profile("dev")` — đọc `CORS_DEV_ORIGIN` (comma list), methods
  GET/POST/PATCH, headers Authorization/Content-Type/X-Request-Id. Compose (default profile) → list rỗng →
  không emit ACAO (deny-by-default, conventions/07).

### 4.7 Test strategy (CI = Postgres thật, KHÔNG H2)
- CI service container `postgres:16-alpine` **mount `platform/postgres/init/`** → init script chạy thật
  — container env PHẢI ĐỦ cho `set -euo pipefail` init: `POSTGRES_USER/PASSWORD/DB` + 4 password
  `NODE_SVC_DB_PASSWORD, SPRING_SVC_DB_PASSWORD, GO_SVC_DB_PASSWORD, GO_READONLY_DB_PASSWORD`, ports 5432:5432.
  Datasource test: `SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/boilerplate`,
  `SPRING_DATASOURCE_USERNAME=spring_svc`, `SPRING_DATASOURCE_PASSWORD=<giá trị SPRING_SVC_DB_PASSWORD env>`.
- `@SpringBootTest` (webEnvironment MOCK, MockMvc): seed-id-match (đọc `contracts/auth/users.json` thật
  qua `USERS_FIXTURE_PATH`); JWT filter 5 case (valid/expired/garbage/missing/wrong-iss) + OPTIONS preflight
  skip; users API (list/get/post/patch/404/409/400 + POST-no-roles default); teams API (list/get/post +
  duplicate memberIds); healthz/readyz shape; envelope shape.
- **Test isolation**: CRUD/PATCH tests `@Transactional` (rollback sau mỗi test) → không làm bẩn bảng
  `users`/`teams`; seed-id-match test KHÔNG transactional + chạy độc lập (assert bảng users == fixture).
- Local không JDK → test chỉ chạy CI (README ghi rõ; toolchain-in-Docker là đường chính theo brief).

### 4.8 Docker & CI
- Dockerfile theo conventions/01 nguyên văn (deps `dependency:go-offline` → build `package -DskipTests`
  → runtime temurin-21-jre-alpine, USER 1001, EXPOSE 8081). `.dockerignore`: target, .git, test artifacts.
- `.github/workflows/services-spring-svc.yml` từ template: (1) build-test `./mvnw -B verify` + postgres
  service container (env đủ 4 DB password — §4.7) + init mount + `USERS_FIXTURE_PATH` tuyệt đối;
  (2) docker-build; (3) boot-smoke compose up postgres+auth-mock+spring-svc+gateway → naked healthz/readyz
  → login auth-mock qua gateway → GET `/api/users/users/{aliceId}` 200 → direct :8081 no-token/garbage-token
  → 401; (4) drift-guard snapshot diff.
- **Path-filter** (`on.push.paths` + `pull_request.paths`): `services/spring-svc/**`, compose entry,
  workflow file, **`contracts/openapi/users.yaml`** (template không có — thêm, để drift-guard không mù khi
  đổi contract mà không đụng spring-svc).

## 5. Impl outline

9 tasks: (1) scaffold+pom+wrapper+codegen; (2) V1 DDL+entities+repos; (3) V2 seed+match-test;
(4) JWT filter+tests; (5) users API+tests; (6) teams API+tests; (7) health/logging/CORS+tests;
(8) swagger+Dockerfile+README; (9) CI workflow+evidence. Commit atomically per task, `feat(sf-3): …`.

## 6. Risks & unverified assumptions

| # | Risk/assumption | Xử lý |
|---|-----------------|-------|
| 1 | Version pin (Boot 3.5.x, springdoc 2.8.x, ogp 7.x) không tồn tại trên Maven Central | Chỉ dùng version đã release trước 6/2026; sai → CI fail rõ ràng, bump 1 lần |
| 2 | openapi-generator spring + useSpringBoot3 + jjwt/jackson conflict | Generator chỉ emit POJO + annotation; verify ở task 1 (compile green gate) |
| 3 | Hibernate + `text[]` mapping | `@JdbcTypeCode(SqlTypes.ARRAY)` Hibernate 6.6; seed test chặn ngay task 3 |
| 4 | Flyway Java migration reflection (no-arg ctor, không thấy Spring beans) | Dùng System.getenv + plain JDBC qua `Context.getConnection()` — đúng API BaseJavaMigration |
| 5 | JWT interop với auth-mock | Verified: node jsonwebtoken HS256 = UTF-8 bytes; boot-smoke login thật là proof cuối |
| 6 | CI-only verify loop chậm | Gom test đủ dày mỗi commit; escape-hatch 2-fail-same-cause của workflow |
| 7 | Codegen base-path không khớp FINAL path table | Verify ngay task 1 (context-load + api-docs paths assertion ở test) |
