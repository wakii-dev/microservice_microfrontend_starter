# Plan — SF-3 spring-svc — user API (FI-71)

> Story FI-62 · spec slice: `docs/superpowers/specs/2026-10-12-sf-3-spring-svc-design.md` · impact: `2026-10-12-sf-3-spring-svc-impact.md` · context: `docs/superpowers/contexts/sf-3.md`
> Worktree: `__STACK_ORG__/sf-3-spring-svc` (fork từ dest `__STACK_ORG__/story-fi62-micro-boilerplate`) — KHÔNG merge dest, coordinator merge.
> Tier: Full (9 tasks) · Verify: CI-only (dev machine không Docker/JDK) · Commit: atomic per task, `feat(sf-3): …`
> Ghi chú verify: Exit "green (CI)" của T1-T8 là **back-verified ở run đầu của T9** (workflow tồn tại từ T9) — không watch-CI per-task ở T1-T8. README T8 thêm ADR: mirror /api/users/healthz là pattern conventions/02 (như auth-mock), probe dùng naked.

## Tasks

- [ ] Task 1 — Scaffold: `pom.xml` (Boot 3.5.x Web MVC, Java 21, validation/actuator/data-jpa/flyway+pg/jjwt 0.12/logstash-logback-encoder/springdoc; openapi-generator-maven-plugin spring `interfaceOnly useSpringBoot3` trên snapshot), mvnw wrapper 3.3.x script-only, `application.yml` env fail-fast, snapshot `src/main/resources/openapi/users.yaml` **BIT-IDENTICAL — không thêm comment/header** (provenance ghi README). Exit: codegen + compile green (CI).
- [ ] Task 2 — `V1__init.sql` (users/teams/team_members — uuid PK, roles text[], snake_case) + entities + Spring Data repos; `ddl-auto: none`. Exit: context boot + repo green trên CI postgres.
- [ ] Task 3 — `V2__SeedUsers.java` BaseJavaMigration đọc `USERS_FIXTURE_PATH` (Jackson `FAIL_ON_UNKNOWN_PROPERTIES=false` — fixture có `$comment` + JDBC `createArrayOf`), fail-fast thiếu/sai file; **SeedMatchIntegrationTest** — DB == `contracts/auth/users.json` 100% (id/email/displayName/roles); test không transactional. Exit: THE seed exit criterion green.
- [ ] Task 4 — `JwtVerifier` (jjwt HS256 UTF-8 secret, exp, iss=`auth-mock`) + `JwtAuthFilter` (skip `/healthz`,`/readyz`,`/actuator/**`,`/v3/api-docs/**`,`/swagger-ui/**` + mọi OPTIONS preflight; fail → 401 envelope `UNAUTHORIZED` + requestId). Tests: valid/expired/garbage/missing/wrong-iss + OPTIONS. Exit: 401 TỪ SERVICE green.
- [ ] Task 5 — Users API **FINAL path table** (contract-resolved: `/api/users/users`, `/api/users/users/{userId}`): list(limit/offset, @Validated 400 ngoài [1,100])/POST(201; **thiếu roles → default ["user"] server-side**; 409 CONFLICT)/GET(200,404)/PATCH(200; 400 body rỗng); `@RestControllerAdvice` envelope (VALIDATION_ERROR/NOT_FOUND/CONFLICT/INTERNAL) + echo `X-Request-Id` + MDC. Tests MockMvc **@Transactional (rollback)**. Exit: users tests green.
- [ ] Task 6 — Teams API (final paths `/api/users/teams`, `/api/users/teams/{teamId}`): list/POST(name+memberIds, **dedupe trước insert**)/GET kèm memberIds/404. Tests (@Transactional). Exit: teams tests green.
- [ ] Task 7 — Health/log/CORS: `/healthz` `{"status":"ok"}` naked (hand-written; generated getHealthz mirror); `/readyz` DB thật (503 envelope); actuator liveness probes; logback `LogstashEncoder` (`ts`,`msg`,customFields `service=spring-svc`, MDC requestId, LOG_LEVEL env, **level lowercase qua custom `LowercaseLevelJsonProvider`**); CORS `@Profile("dev")` đọc `CORS_DEV_ORIGIN`. Tests shape. Exit: green.
- [ ] Task 8 — Swagger (springdoc host-port 8081; api-docs chứa đúng FINAL path table) + Dockerfile multi-stage conventions/01 + `.dockerignore` + README standalone (chạy CI/toolchain, env table, API, ADR: JWT filter tự viết + snapshot bit-identical + fixture evolution V3 + email case-sensitivity). Exit: docker-build pass CI.
- [ ] Task 9 — CI: `.github/workflows/services-spring-svc.yml` — build-test (mvnw verify + postgres service container **env ĐỦ 4 DB password** + init mount + `USERS_FIXTURE_PATH` + datasource test spring_svc@localhost:5432), docker-build, boot-smoke (compose up postgres+auth-mock+spring-svc+gateway → naked healthz/readyz → login → GET `/api/users/users/{aliceId}` 200 → direct :8081 no-token/garbage → 401), drift-guard diff; **path-filter thêm `contracts/openapi/users.yaml`**; evidence `docs/superpowers/evidence/sf-3/test-run.txt`. Exit: CI 4/4 green.

## Verification (exit criteria — checklist ACCEPTANCE sf-3.md)

1. CI xanh (build-test + docker-build + boot-smoke + drift-guard) — runs trên `__STACK_ORG__/sf-3-spring-svc`.
2. Từng dòng ACCEPTANCE `docs/superpowers/contexts/sf-3.md` kiểm riêng (Phase 5 verifier).
3. Rule 0: swagger UI + web port — browser verify khi khả thi; không khả thi (no Docker/JDK local) → CI curl evidence + khai báo trung thực trong evidence + nhờ user nhìn thêm.
4. Code-reviewer độc lập APPROVED (rolling theo nhóm task 1-3 / 4-7 / 8-9; comment Linear VERDICT + CHECKLIST-4Q).
5. `~/.claude/bin/story-verify sf-3` sạch; evidence convention B1+ (hash + `tdd:` line).
6. KHÔNG set Linear Done; KHÔNG merge dest; report DONE qua orchestration message + comment FI-71.
